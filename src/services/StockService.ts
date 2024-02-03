import Stock from '../database/models/Stock';
import StockRepository from '../repositories/StockRepository';
import AppError from '../errors/AppError';
import InvoiceService from './InvoiceService';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';
import formatNumber from '../helper/format';

interface Position {
  symbol: string;
  quantity: number;
  history: History[];
}

interface History {
  startDate: Date;
  endDate: Date | null;
  fee: Fee;
  profitLoss: number;
  average: Average;
}

interface Fee {
  buy: number;
  sell: number;
  total: number;
}

interface Average {
  buy: Buy;
  sell: Sell;
}

interface Buy {
  unit: number;
  quantity: number;
  total: number;
}

interface Sell {
  unit: number;
  quantity: number;
  total: number;
}

export default class StockService {
  private stockRepository = new StockRepository();

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

  public async getAllGrouped(): Promise<Position[]> {
    const allStocks = await this.stockRepository.getAllByDate(
      new Date('2024-12-31')
    );

    const positionMap = new Map<string, Position>();

    let currentSymbol: string;
    let lastSymbol: string;
    let lastDate: Date;
    let lastQuantity: number;
    let countBuy = 0;
    let countSell = 0;

    allStocks.forEach((stock, index, array) => {
      currentSymbol = stock.symbol;
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

        if (stock.operation) {
          position.quantity += stock.quantity;
          position.history.map(item => {
            if (item.endDate === null) {
              const unitPrice = formatNumber(stock.price / stock.quantity);
              item.fee.buy = formatNumber(item.fee.buy + stock.fee);
              item.average.buy.unit = formatNumber(
                item.average.buy.unit + unitPrice
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
        } else {
          position.quantity -= stock.quantity;
          position.history.map(item => {
            if (item.endDate === null) {
              const unitPrice = formatNumber(stock.price / stock.quantity);
              item.fee.sell = formatNumber(item.fee.sell + stock.fee);
              item.average.sell.unit = formatNumber(
                item.average.sell.unit + unitPrice
              );
              item.average.sell.quantity += stock.quantity;
            }
            return item;
          });
        }

        if (position.quantity === 0) {
          position.history.map(item => {
            return this.calculatedHistory(
              item,
              countBuy,
              countSell,
              stock.date,
              true
            );
          });

          countBuy = 0;
          countSell = 0;
        }

        if (lastSymbol !== currentSymbol && lastSymbol !== undefined) {
          const lastPosition = positionMap.get(lastSymbol);
          if (lastPosition !== undefined) {
            lastPosition.history.map(item => {
              return this.calculatedHistory(
                item,
                countBuy,
                countSell,
                lastDate
              );
            });
          }
          countBuy = 0;
          countSell = 0;
        }

        lastSymbol = currentSymbol;
        lastDate = stock.date;
        lastQuantity = position.quantity;
        countBuy += 1;
        countSell += 1;
      }
    });

    const positions = Array.from(positionMap.values());
    return positions;
  }

  private calculatedHistory(
    item: History,
    countBuy: number,
    countSell: number,
    endDate: Date,
    isCalculateProfitLoss = false
  ): History {
    if (item.endDate === null) {
      const averageUnitBuy =
        formatNumber(item.average.buy.unit) / formatNumber(countBuy);
      const averageUnitSell =
        formatNumber(item.average.sell.unit) / formatNumber(countSell);
      item.average.buy.unit = formatNumber(averageUnitBuy);
      item.average.sell.unit = formatNumber(averageUnitSell);
      const totalBuy = item.average.buy.unit * item.average.buy.quantity;
      const totalSell = item.average.sell.unit * item.average.sell.quantity;
      item.endDate = endDate;
      item.fee.total = formatNumber(item.fee.buy + item.fee.sell);
      item.average.buy.total = formatNumber(totalBuy + item.fee.buy);
      item.average.sell.total = formatNumber(totalSell - item.fee.sell);
      if (isCalculateProfitLoss) {
        item.profitLoss = formatNumber(
          item.average.sell.total - item.average.buy.total - item.fee.total
        );
      }
    }
    return item;
  }

  private getEmptyPosition(symbol: string, start: Date): Position {
    return {
      symbol,
      quantity: 0,
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
}
