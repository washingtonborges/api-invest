import dotenv from 'dotenv';
import axios from 'axios';
import { parse } from 'date-fns';
import yahooFinance from 'yahoo-finance2';
import Stock from '../database/models/Stock';
import StockRepository from '../repositories/StockRepository';
import LatestQuoteRepository from '../repositories/LatestQuoteRepository';
import AppError from '../errors/AppError';
import InvoiceService from './InvoiceService';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';
import formatNumber from '../helper/format';
import LatestQuote from '../database/models/LatestQuote';
import Position from '../models/Position';
import History from '../models/History';
import Latest from '../models/Latest';

dotenv.config();

export default class StockService {
  private stockRepository = new StockRepository();

  private latestQuoteRepository = new LatestQuoteRepository();

  private invoiceService = new InvoiceService();

  public async getAllByUserId(userId: string): Promise<Stock[]> {
    return this.stockRepository.getAllByUserId(userId);
  }

  public async getByUserId(
    id: string,
    userId: string
  ): Promise<Stock | undefined> {
    if (id.length !== 24) {
      throw new AppError('The requested product was not found');
    }
    const stock = this.stockRepository.getByUserId(id, userId);
    if (!stock) {
      throw new AppError('The requested product was not found');
    }
    return stock;
  }

  public async create(stock: Stock): Promise<Stock> {
    return this.stockRepository.createAndSave(stock);
  }

  public createAndSaveList(list: Stock[]): void {
    list.forEach(stock => {
      this.create(stock);
    });
  }

  public async import(
    files: string[],
    userId: string
  ): Promise<ResultMessageDTO[]> {
    const arrayBytes = this.invoiceService.convertFilesArrayStringToByte(files);
    const promises = arrayBytes.map(async (bytes: Uint8Array) => {
      return this.convertInvoiceDataToStockList(bytes, userId);
    });
    const resultsArray = await Promise.all(promises);
    const list = resultsArray.reduce((acc, result) => acc.concat(result), []);
    return list;
  }

  public async convertInvoiceDataToStockList(
    bytes: Uint8Array,
    userId: string
  ): Promise<ResultMessageDTO[]> {
    const results: ResultMessageDTO[] = [];
    const invoice = await this.invoiceService.readByData(bytes.buffer);
    const existInvoice = await this.invoiceService.existInvoiceRawByNumber(
      invoice.number
    );
    if (existInvoice) {
      results.push(
        new ResultMessageDTO(
          invoice.number,
          `Failed to process, already exist.`
        )
      );
    } else {
      const stocks = this.invoiceService.convertToStock(invoice, userId);
      if (stocks.length === invoice.operations.length) {
        this.createAndSaveList(stocks);
        this.invoiceService.createAndSaveInvoiceRaw(invoice, userId);
        results.push(
          new ResultMessageDTO(
            invoice.number,
            'Process successfully!',
            stocks,
            true
          )
        );
      } else {
        results.push(
          new ResultMessageDTO(
            invoice.number,
            `Failed to process, different stock quantity.`
          )
        );
      }
    }
    return results;
  }

  public async getAllGroupedByDateAndUserId(
    date: Date,
    isLatestQuote = false,
    isCurrentPosition = false,
    userId: string
  ): Promise<Position[]> {
    const allStocks = await this.stockRepository.getAllByDateAndUserId(
      date,
      userId
    );

    if (allStocks.length === 0) {
      return [] as Position[];
    }

    const positionMap = new Map<string, Position>();

    let currentSymbol: string;
    let lastSymbol: string;
    let nextSymbol: string;
    let lastDate: Date;
    let lastQuantity: number;
    let countBuy = 0;
    let countSell = 0;

    allStocks.forEach((stock, index, array) => {
      currentSymbol = stock.symbol;
      if (index + 1 < array.length) {
        nextSymbol = array[index + 1].symbol;
      }
      const isLastItem = index === array.length - 1;

      if (!positionMap.has(currentSymbol)) {
        positionMap.set(
          currentSymbol,
          this.getEmptyPosition(currentSymbol, stock.date)
        );
      }

      const position = positionMap.get(currentSymbol);

      if (position !== undefined) {
        if (
          lastSymbol === currentSymbol &&
          lastSymbol !== undefined &&
          lastQuantity === 0
        ) {
          position.history.push(this.getEmptyHistory(stock.date));

          countBuy = 0;
          countSell = 0;
        }

        if (lastSymbol !== currentSymbol && lastSymbol !== undefined) {
          const lastPosition = positionMap.get(lastSymbol);
          if (lastPosition !== undefined) {
            lastPosition.history.map(item => {
              return this.calculatedHistory(
                item,
                lastDate,
                countBuy,
                countSell
              );
            });
            countBuy = 0;
            countSell = 0;
          }
        }

        if (stock.operation) {
          position.quantity += stock.quantity;
          position.history.map(item => {
            if (item.endDate === null) {
              item.fee.buy = formatNumber(item.fee.buy + stock.fee);
              item.average.buy.unit = formatNumber(
                item.average.buy.unit + stock.unit
              );
              item.average.buy.quantity += stock.quantity;
              if (isLastItem) {
                item.endDate = new Date();
                const totalBuy =
                  item.average.buy.unit * item.average.buy.quantity;
                item.average.buy.total = formatNumber(totalBuy + item.fee.buy);
              }
            }
            return item;
          });
          countBuy += 1;
        } else {
          position.quantity -= stock.quantity;
          position.history.map(item => {
            if (item.endDate === null) {
              item.fee.sell = formatNumber(item.fee.sell + stock.fee);
              item.average.sell.unit = formatNumber(
                item.average.sell.unit + stock.unit
              );
              item.average.sell.quantity += stock.quantity;
            }
            return item;
          });
          countSell += 1;
        }

        if (
          position.quantity === 0 ||
          (lastSymbol === currentSymbol && currentSymbol !== nextSymbol)
        ) {
          position.history.map(item => {
            return this.calculatedHistory(
              item,
              stock.date,
              countBuy,
              countSell,
              true
            );
          });

          countBuy = 0;
          countSell = 0;
        }

        lastSymbol = currentSymbol;
        lastDate = stock.date;
        lastQuantity = position.quantity;
      }
    });

    let positions = Array.from(positionMap.values());
    positions = this.filterStocks(date, positions);
    if (isLatestQuote && date.getFullYear() !== new Date().getFullYear()) {
      positions = await this.addLatestQuote(positions, date.getFullYear());
    }
    if (isCurrentPosition) {
      positions = positions.filter(position => {
        return position.history.some(
          history =>
            history.endDate === null ||
            new Date(history.endDate).getFullYear() === new Date().getFullYear()
        );
      });
    }
    return positions;
  }

  private filterStocks(date: Date, positions: Position[]): Position[] {
    return positions.filter(position => {
      const { quantity, history } = position;

      if (quantity > 0) {
        return !history.every(
          h =>
            (h.endDate ? new Date(h.endDate) : new Date()).getFullYear() <
              new Date(date).getFullYear() && h.average.buy.quantity < quantity
        );
      }

      return history.some(
        h =>
          (h.endDate ? new Date(h.endDate) : new Date()).getFullYear() ===
          new Date(date).getFullYear()
      );
    });
  }

  private calculatedHistory(
    item: History,
    endDate: Date,
    countBuy: number,
    countSell: number,
    isCalculateProfitLoss = false
  ): History {
    if (item.endDate === null) {
      if (countBuy !== 0) {
        item.average.buy.unit = formatNumber(item.average.buy.unit / countBuy);
      }
      if (countSell !== 0) {
        item.average.sell.unit = formatNumber(
          item.average.sell.unit / countSell
        );
      }
      const totalBuy = formatNumber(
        item.average.buy.unit * item.average.buy.quantity
      );
      const totalSell = formatNumber(
        item.average.sell.unit * item.average.sell.quantity
      );
      item.fee.total = formatNumber(item.fee.buy + item.fee.sell);
      item.average.buy.total = formatNumber(totalBuy + item.fee.buy);
      item.average.sell.total = formatNumber(totalSell - item.fee.sell);
      if (isCalculateProfitLoss && countBuy !== 0 && countSell !== 0) {
        item.endDate = endDate;
        const partialQuantity =
          item.average.buy.quantity - item.average.sell.quantity;
        const isSellAllStockPosition = partialQuantity === 0;
        if (isSellAllStockPosition) {
          item.profitLoss = formatNumber(
            item.average.sell.total - item.average.buy.total - item.fee.total
          );
        } else {
          const partialTotalSell = formatNumber(
            partialQuantity * item.average.sell.unit
          );
          const partialTotalBuy = formatNumber(
            partialQuantity * item.average.buy.unit
          );
          item.profitLoss = formatNumber(
            partialTotalSell - partialTotalBuy - item.fee.total
          );
        }
      }
    }
    return item;
  }

  private getEmptyPosition(symbol: string, start: Date): Position {
    return {
      symbol,
      quantity: 0,
      latest: {
        date: null,
        unit: 0,
        total: 0,
        from: ''
      },
      history: [
        {
          startDate: start,
          endDate: null,
          fee: {
            buy: 0,
            sell: 0,
            total: 0
          },
          average: {
            buy: {
              unit: 0,
              quantity: 0,
              total: 0
            },
            sell: {
              unit: 0,
              quantity: 0,
              total: 0
            }
          },
          profitLoss: 0
        }
      ]
    };
  }

  private getEmptyHistory(start: Date): History {
    return {
      startDate: start,
      endDate: null,
      fee: {
        buy: 0,
        sell: 0,
        total: 0
      },
      average: {
        buy: {
          unit: 0,
          quantity: 0,
          total: 0
        },
        sell: {
          unit: 0,
          quantity: 0,
          total: 0
        }
      },
      profitLoss: 0
    };
  }

  private async addLatestQuote(
    positions: Position[],
    year: number
  ): Promise<Position[]> {
    const updatedPositions = await positions.map(async position => {
      let latestQuote = await this.latestQuoteRepository.getBySymbolAndYear(
        position.symbol,
        year
      );

      if (latestQuote === undefined) {
        const latest = await this.getLatestQuotes(position.symbol, year);
        if (latest.date !== null && latest.date !== undefined) {
          const newLatestQuote: LatestQuote = {
            symbol: position.symbol,
            unit: latest.unit,
            date: latest.date,
            from: latest.from
          };
          delete newLatestQuote._id;

          latestQuote = await this.createLatestQuote(newLatestQuote);
        }
      }

      if (latestQuote !== undefined) {
        position.latest = {
          date: latestQuote.date,
          unit: latestQuote.unit,
          total: formatNumber(position.quantity * latestQuote.unit)
        } as Latest;
      }

      return position;
    });
    return Promise.all(updatedPositions);
  }

  private async getLatestQuotes(symbol: string, year: number): Promise<Latest> {
    let latestQuote = await this.getHistoricalPriceByYahooFinance(symbol, year);
    if (!latestQuote) {
      latestQuote = await this.getHistoricalPriceByAlphaVantage(symbol, year);
    }
    if (!latestQuote) {
      latestQuote = await this.getHistoricalPriceByIEXCloud(symbol, year);
    }
    if (!latestQuote) {
      latestQuote = await this.getHistoricalPriceByInfomoney(symbol, year);
    }
    if (!latestQuote) {
      latestQuote = {
        date: new Date(`${year}-12-31`),
        unit: 0,
        from: '404 - Not found'
      } as Latest;
    }
    return latestQuote;
  }

  private async getHistoricalPriceByYahooFinance(
    symbol: string,
    year: number
  ): Promise<Latest | undefined> {
    try {
      const queryOptions = {
        period1: `${year}-12-28`,
        period2: `${year}-12-31`
      };
      const data = await yahooFinance.historical(`${symbol}.SA`, queryOptions);
      if (data.length === 0) {
        return undefined;
      }

      const latestItem = data.reduce((latest, current) => {
        return new Date(latest.date) > new Date(current.date)
          ? latest
          : current;
      });

      const latest: Latest = {
        date: latestItem.date,
        unit: parseFloat(latestItem.close.toFixed(2)),
        from: 'YahooFinance'
      } as Latest;
      return latest;
    } catch (error) {
      console.error('Erro ao buscar os dados:', error);
      return undefined;
    }
  }

  private async getHistoricalPriceByAlphaVantage(
    symbol: string,
    year: number
  ): Promise<Latest | undefined> {
    const API_KEY = process.env.ALPHAVANTAGE_API_KEY ?? '';
    const url = `${
      process.env.ALPHAVANTAGE_URL ?? ''
    }/query?function=TIME_SERIES_DAILY&symbol=${symbol}.SA&apikey=${API_KEY}`;

    try {
      const response = await axios.get(url);

      const data = response.data['Time Series (Daily)'];
      if (!data) {
        throw new Error('Dados não encontrados na resposta da API.');
      }

      const dates = Object.keys(data);
      const targetDate = dates.find(
        date =>
          new Date(date).getFullYear() === year &&
          new Date(date).getMonth() === 12
      );

      if (!targetDate) {
        throw new Error(`Nenhuma data encontrada para o ano ${year}.`);
      }

      const closingPrice = data[targetDate]['4. close'];

      const latest: Latest = {
        date: new Date(targetDate),
        unit: parseFloat(closingPrice),
        from: 'AlphaVantage'
      } as Latest;

      return latest;
    } catch (error) {
      console.error('Erro ao buscar os dados:', error);
      return undefined;
    }
  }

  private async getHistoricalPriceByIEXCloud(
    symbol: string,
    year: number
  ): Promise<Latest | undefined> {
    const API_KEY = process.env.IEXCLOUD_API_KEY ?? '';
    const url = `${
      process.env.IEXCLOUD_URL ?? ''
    }/${symbol}?from=${year}-12-28&to=${year}-12-31&token=${API_KEY}`;

    try {
      const response = await axios.get(url);
      const { data } = response;
      if (data.length === 0) {
        throw new Error('Dados não encontrados na resposta da API.');
      }

      const latestItem = data.reduce((latest: any, current: any) => {
        return new Date(latest.priceDate) > new Date(current.priceDate)
          ? latest
          : current;
      });

      const latest: Latest = {
        date: new Date(latestItem.priceDate),
        unit: parseFloat(latestItem.close),
        from: 'IEXCloud'
      } as Latest;

      return latest;
    } catch (error) {
      console.error('Erro ao buscar os dados:', error);
      return undefined;
    }
  }

  private async getHistoricalPriceByInfomoney(
    symbol: string,
    year: number
  ): Promise<Latest | undefined> {
    const url = process.env.INFOMONEY_URL ?? '';

    const payload = {
      page: 0,
      numberItems: 99999,
      initialDate: `28/12/${year}`,
      finalDate: `31/12/${year}`,
      symbol
    };

    const result = await axios
      .post(url, payload)
      .then(response => {
        if (response.data === '') {
          return undefined;
        }
        const latestItem = response.data.reduce((latest: any, current: any) => {
          const currentTimestamp = parseInt(current[0].timestamp, 10) * 1000;
          const latestTimestamp = parseInt(latest[0].timestamp, 10) * 1000;
          return new Date(latestTimestamp) > new Date(currentTimestamp)
            ? latest
            : current;
        });

        const latest: Latest = {
          date: parse(latestItem[0].display, 'dd/MM/yyyy', new Date()),
          unit: parseFloat(latestItem[2].replace(/\./g, '').replace(',', '.')),
          from: 'Infomoney'
        } as Latest;
        return latest;
      })
      .catch(error => {
        console.error('Erro ao obter as últimas cotações:', error);
        return undefined;
      });

    return result;
  }

  public async updateLatestQuote(
    latestQuote: LatestQuote
  ): Promise<LatestQuote> {
    const year = latestQuote.date.getFullYear();
    const oldLatestQuote = await this.latestQuoteRepository.getBySymbolAndYear(
      latestQuote.symbol,
      year
    );
    if (oldLatestQuote) {
      oldLatestQuote.date = latestQuote.date;
      oldLatestQuote.unit = latestQuote.unit;
      oldLatestQuote.from = latestQuote.from;
      return this.latestQuoteRepository.updateAndSave(oldLatestQuote);
    }
    return this.latestQuoteRepository.createAndSave(latestQuote);
  }

  public async createLatestQuote(
    latestQuote: LatestQuote
  ): Promise<LatestQuote> {
    return this.latestQuoteRepository.createAndSave(latestQuote);
  }

  public async getYearsByUserId(userId: string): Promise<number[]> {
    return this.stockRepository.getYearsByUserId(userId);
  }
}
