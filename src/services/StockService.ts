import Stock from '../models/Stock';
import StockRepository from '../repositories/ProductRepository';
import AppError from '../errors/AppError';

export default class StockService {
  private stockRepository = new StockRepository();

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
}
