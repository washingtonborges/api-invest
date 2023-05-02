import StockService from '../services/StockService';
import Stock from '../models/Stock';

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
}
