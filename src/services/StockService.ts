import axios from 'axios';
import { parse } from 'date-fns';
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

export default class StockService {
  private stockRepository = new StockRepository();

  private latestQuoteRepository = new LatestQuoteRepository();

  private invoiceService = new InvoiceService();

  public async getAll(): Promise<Stock[]> {
    return this.stockRepository.getAll();
  }

  public async get(id: string): Promise<Stock | undefined> {
    if (id.length !== 24) {
      throw new AppError('The requested product was not found');
    }
    const stock = this.stockRepository.get(id);
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

  public async import(files: string[]): Promise<ResultMessageDTO[]> {
    const arrayBytes = this.invoiceService.convertFilesArrayStringToByte(files);
    const promises = arrayBytes.map(async (bytes: Uint8Array) => {
      return this.convertInvoiceDataToStockList(bytes);
    });
    const resultsArray = await Promise.all(promises);
    const list = resultsArray.reduce((acc, result) => acc.concat(result), []);
    return list;
  }

  public async convertInvoiceDataToStockList(
    bytes: Uint8Array
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
      const stocks = this.invoiceService.convertToStock(invoice);
      if (stocks.length === invoice.operations.length) {
        this.createAndSaveList(stocks);
        this.invoiceService.createAndSaveInvoiceRaw(invoice);
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

  public async getAllGrouped(
    date: Date,
    isLatestQuote = false,
    isCurrentPosition = false
  ): Promise<Position[]> {
    const allStocks = await this.stockRepository.getAllByDate(date);

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
    if (isLatestQuote) {
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
        total: 0
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
        await this.waitRandomTime(7, 13);
        await this.waitRandomTime(2, 8);
        const latest = await this.getLatestQuotes(position.symbol, year);
        if (latest.date !== null && latest.date !== undefined) {
          const newLatestQuote: LatestQuote = {
            symbol: position.symbol,
            unit: latest.unit,
            date: latest.date
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

  private async waitRandomTime(max: number, min: number): Promise<void> {
    const randomTimeInSeconds = Math.random() * (max - min) + min;
    const randomTimeInMilliseconds =
      randomTimeInSeconds * (1321 + 689 / (max - min));
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, randomTimeInMilliseconds);
    });
  }

  private async getLatestQuotes(symbol: string, year: number): Promise<Latest> {
    const url =
      'https://www.infomoney.com.br/wp-json/infomoney/v1/quotes/history';

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
          return {} as Latest;
        }
        const data = response.data.pop();
        const latest: Latest = {
          date: parse(data[0].display, 'dd/MM/yyyy', new Date()),
          unit: parseFloat(data[2].replace(/\./g, '').replace(',', '.'))
        } as Latest;
        return latest;
      })
      .catch(error => {
        console.error('Erro ao obter as últimas cotações:', error);
        return {} as Latest;
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
      return this.latestQuoteRepository.updateAndSave(oldLatestQuote);
    }
    return this.latestQuoteRepository.createAndSave(latestQuote);
  }

  public async createLatestQuote(
    latestQuote: LatestQuote
  ): Promise<LatestQuote> {
    return this.latestQuoteRepository.createAndSave(latestQuote);
  }
}
