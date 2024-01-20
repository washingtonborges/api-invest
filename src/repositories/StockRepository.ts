import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import Stock from '../database/models/Stock';

@EntityRepository(Stock)
export default class Stockepository extends Repository<Stock> {
  public async getAll(): Promise<Stock[]> {
    const productRepository = getCustomRepository(Stockepository);
    return productRepository.find();
  }

  public async get(id: string): Promise<Stock | undefined> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.findOne({ _id: new ObjectId(id) });
  }

  public async createAndSave(stock: Stock): Promise<Stock> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.save(stock);
  }
}
