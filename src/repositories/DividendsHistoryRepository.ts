import {
  EntityRepository,
  Repository,
  getCustomRepository,
  getRepository
} from 'typeorm';
import { ObjectId } from 'mongodb';
import DividendsHistory from '../database/models/DividendsHistory';

@EntityRepository(DividendsHistory)
export default class DividendsHistoryRepository extends Repository<
  DividendsHistory
> {
  public async get(id: string): Promise<DividendsHistory | undefined> {
    const repository = getCustomRepository(DividendsHistoryRepository);
    return repository.findOne({ _id: new ObjectId(id) });
  }

  public async getBySymbol(
    symbol: string
  ): Promise<DividendsHistory | undefined> {
    const repository = getCustomRepository(DividendsHistoryRepository);
    const result = repository.findOne({
      where: { symbol },
      relations: ['dividend']
    });
    return result;
  }

  public async getBySymbolAndDate(symbol: string): Promise<boolean> {
    const repository = getCustomRepository(DividendsHistoryRepository);
    const currentDate = new Date();
    const result = await repository.find({
      symbol
    });

    const filteredResults = result.filter(
      entry =>
        entry.update.getFullYear() === currentDate.getFullYear() &&
        entry.update.getMonth() === currentDate.getMonth() &&
        entry.update.getDay() === currentDate.getDay()
    );
    return filteredResults.length > 0;
  }

  public async getLatestUpdate(
    symbol: string
  ): Promise<DividendsHistory | undefined> {
    const repository = getRepository(DividendsHistory);

    const result = await repository.findOne({
      where: { symbol },
      order: { update: 'DESC' }
    });

    return result;
  }

  public async createAndSave(obj: DividendsHistory): Promise<DividendsHistory> {
    const repository = getCustomRepository(DividendsHistoryRepository);
    return repository.save(obj);
  }

  public async updateAndSave(obj: DividendsHistory): Promise<DividendsHistory> {
    const id = obj._id ?? new ObjectId();
    const idString = id instanceof ObjectId ? id.toHexString() : id;
    const repository = getCustomRepository(DividendsHistoryRepository);
    repository.update(idString, obj);
    return obj;
  }
}
