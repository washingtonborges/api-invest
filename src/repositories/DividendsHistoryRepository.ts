import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
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

  public async getBySymbol(symbol: string): Promise<DividendsHistory> {
    const repository = getCustomRepository(DividendsHistoryRepository);
    const result = await repository.find({ symbol });
    const dividendsHistory = result[0];
    return dividendsHistory;
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