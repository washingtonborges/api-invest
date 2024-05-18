import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import LatestQuote from '../database/models/LatestQuote';

@EntityRepository(LatestQuote)
export default class LatestQuoteRepository extends Repository<LatestQuote> {
  public async getAll(): Promise<LatestQuote[]> {
    const repository = getCustomRepository(LatestQuoteRepository);
    return repository.find();
  }

  public async get(id: string): Promise<LatestQuote | undefined> {
    const repository = getCustomRepository(LatestQuoteRepository);
    return repository.findOne({ _id: new ObjectId(id) });
  }

  public async getBySymbolAndYear(
    symbol: string,
    year: number
  ): Promise<LatestQuote> {
    const repository = getCustomRepository(LatestQuoteRepository);
    const result = await repository.find({ symbol });
    const filteredResults = result.filter(
      entry => entry.date.getFullYear() === year
    );
    const latestQuote = filteredResults[0];
    return latestQuote;
  }

  public async createAndSave(obj: LatestQuote): Promise<LatestQuote> {
    const repository = getCustomRepository(LatestQuoteRepository);
    return repository.save(obj);
  }

  public async updateAndSave(obj: LatestQuote): Promise<LatestQuote> {
    const id = obj._id ?? new ObjectId();
    const idString = id instanceof ObjectId ? id.toHexString() : id;
    const repository = getCustomRepository(LatestQuoteRepository);
    repository.update(idString, obj);
    return obj;
  }
}
