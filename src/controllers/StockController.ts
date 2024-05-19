import StockService from '../services/StockService';
import Stock from '../database/models/Stock';
import ResultMessageDTO from '../models/DTO/ResultMessageDTO';
import Position from '../models/Position';
import LatestQuote from '../database/models/LatestQuote';

export default class ProductController {
  private StockService = new StockService();

  public async getAllByUserId(userId: string): Promise<Stock[]> {
    return this.StockService.getAllByUserId(userId);
  }

  public async getByUserId(
    id: string,
    userId: string
  ): Promise<Stock | undefined> {
    return this.StockService.getByUserId(id, userId);
  }

  public async create(stock: Stock): Promise<Stock> {
    return this.StockService.create(stock);
  }

  public async import(
    files: string[],
    userId: string
  ): Promise<ResultMessageDTO[]> {
    return this.StockService.import(files, userId);
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

  public async getAllGroupedByDateAndUserId(
    date: Date,
    isLatestQuote = false,
    isCurrentPosition = false,
    userId: string
  ): Promise<Position[]> {
    return this.StockService.getAllGroupedByDateAndUserId(
      date,
      isLatestQuote,
      isCurrentPosition,
      userId
    );
  }
}
