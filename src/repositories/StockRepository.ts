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
  public async getAll(): Promise<Stock[]> {
    const productRepository = getCustomRepository(Stockepository);
    return productRepository.find();
  }

  public async getAllByDate(date: Date): Promise<Stock[]> {
    const productRepository = getCustomRepository(Stockepository);
    return productRepository.find({
      where: {
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

  public async get(id: string): Promise<Stock | undefined> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.findOne({ _id: new ObjectId(id) });
  }

  public async createAndSave(stock: Stock): Promise<Stock> {
    const stockRepository = getCustomRepository(Stockepository);
    return stockRepository.save(stock);
  }

  public async getAllGrouped(): Promise<any[]> {
    const stockRepository = getMongoRepository(Stock);

    const result = await stockRepository
      .aggregate([
        {
          $group: {
            _id: '$symbol',
            totalQuantity: {
              $sum: {
                $cond: [
                  { $eq: ['$operation', true] },
                  '$quantity',
                  { $multiply: ['$quantity', -1] }
                ]
              }
            },
            totalValue: {
              $sum: {
                $cond: [
                  { $eq: ['$operation', true] },
                  '$price',
                  { $multiply: ['$price', -1] }
                ]
              }
            },
            totalBuyFee: {
              $sum: {
                $cond: [{ $eq: ['$operation', true] }, '$fee', 0]
              }
            },
            totalSellFee: {
              $sum: {
                $cond: [{ $eq: ['$operation', false] }, '$fee', 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            symbol: '$_id',
            totalQuantity: 1,
            totalValue: { $toDouble: '$totalValue' },
            totalFee: {
              $toDouble: { $sum: ['$totalBuyFee', '$totalSellFee'] }
            },
            totalBuyFee: { $toDouble: '$totalBuyFee' },
            totalSellFee: { $toDouble: '$totalSellFee' },
            profitLoss: { $subtract: [{ $abs: '$totalValue' }, '$totalFee'] }
          }
        }
      ])
      .toArray();

    result.forEach(item => {
      item.totalValue = Math.abs(item.totalValue);
      item.totalBuyFee = Math.abs(item.totalBuyFee);
      item.totalSellFee = Math.abs(item.totalSellFee);
      item.totalFee = Math.abs(item.totalFee);
      item.profitLoss = Math.abs(item.totalValue) - Math.abs(item.totalFee);
    });

    return result;
  }
}
