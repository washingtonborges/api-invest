import Stock from '../database/models/Stock';
import StockRepository from '../repositories/StockRepository';
import AppError from '../errors/AppError';
import InvoiceService from './InvoiceService';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';

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
          new ResultMessageDTO(invoice.number, 'Process successfully!', stocks)
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
}
