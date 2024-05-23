import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import Dividend from '../database/models/Dividend';

@EntityRepository(Dividend)
export default class DividendRepository extends Repository<Dividend> {
  public async get(id: string): Promise<Dividend | undefined> {
    const repository = getCustomRepository(DividendRepository);
    return repository.findOne({ _id: new ObjectId(id) });
  }

  public async createAndSave(obj: Dividend): Promise<Dividend> {
    const repository = getCustomRepository(DividendRepository);
    const dividend = await repository.save(obj);
    return dividend;
  }
}
