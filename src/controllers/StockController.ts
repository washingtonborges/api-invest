import StockService from '../services/StockService';
import Stock from '../database/models/Stock';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';

export default class ProductController {
  private StockService = new StockService();

  public async getAll(): Promise<Stock[]> {
    return this.StockService.getAll();
  }

  public async get(id: string): Promise<Stock | undefined> {
    return this.StockService.get(id);
  }

  public async create(stock: Stock): Promise<Stock> {
    return this.StockService.create(stock);
  }

  public async import(files: string[]): Promise<ResultMessageDTO[]> {
    return this.StockService.import(files);
  }
}
