import {
  EntityRepository,
  Repository,
  getCustomRepository,
  getMongoRepository
} from 'typeorm';
import { ObjectId } from 'mongodb';
import Stock from '../database/models/Stock';

@EntityRepository(Stock)
export default class Stockepository extends Repository<Stock> {
  public async getAllByUserId(userId: string): Promise<Stock[]> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.find({ userId });
  }

  public async getAllByDateAndUserId(
    date: Date,
    userId: string
  ): Promise<Stock[]> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.find({
      where: {
        userId,
        date: {
          $lte: date
        }
      },
      order: {
        symbol: 'ASC',
        date: 'ASC',
        operation: 'DESC'
      }
    });
  }

  public async getByUserId(
    id: string,
    userId: string
  ): Promise<Stock | undefined> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.findOne({ _id: new ObjectId(id), userId });
  }

  public async createAndSave(stock: Stock): Promise<Stock> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.save(stock);
  }

  public async getYearsByUserId(userId: string): Promise<number[]> {
    const stockRepository = getMongoRepository(Stock);
    const pipeline = [
      {
        $match: {
          userId
        }
      },
      {
        $group: {
          _id: { $year: '$date' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id'
        }
      }
    ];

    const result = await stockRepository.aggregate(pipeline).toArray();
    return result.map(item => item.year);
  }

  public async getSymbolByDateAndUserId(
    date: Date,
    userId: string
  ): Promise<string[]> {
    const stockRepository = getMongoRepository(Stock);
    const pipeline = [
      {
        $match: {
          userId,
          date: {
            $lte: date
          }
        }
      },
      {
        $group: {
          _id: '$symbol'
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          symbol: '$_id'
        }
      }
    ];

    const result = await stockRepository.aggregate(pipeline).toArray();
    return result.map(item => item.symbol);
  }
}
