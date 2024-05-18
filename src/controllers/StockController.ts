import StockService from '../services/StockService';
import Stock from '../database/models/Stock';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';
import Position from '../models/Position';
import LatestQuote from '../database/models/LatestQuote';

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

  public async createLatestQuote(
    latestQuote: LatestQuote
  ): Promise<LatestQuote> {
    return this.StockService.createLatestQuote(latestQuote);
  }

  public async updateLatestQuote(
    latestQuote: LatestQuote
  ): Promise<LatestQuote> {
    return this.StockService.updateLatestQuote(latestQuote);
  }

  public async getAllGrouped(
    date: Date,
    isLatestQuote = false,
    isCurrentPosition = false
  ): Promise<Position[]> {
    return this.StockService.getAllGrouped(
      date,
      isLatestQuote,
      isCurrentPosition
    );
  }
}
