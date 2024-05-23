import {
  EntityRepository,
  Repository,
  getCustomRepository,
  getRepository
} from 'typeorm';
import { ObjectId } from 'mongodb';
import Asset from '../database/models/Asset';

@EntityRepository(Asset)
export default class AssetRepository extends Repository<Asset> {
  public async get(id: string): Promise<Asset | undefined> {
    const repository = getCustomRepository(AssetRepository);
    return repository.findOne({ _id: new ObjectId(id) });
  }

  public async getBySymbol(symbol: string): Promise<Asset | undefined> {
    const repository = getCustomRepository(AssetRepository);
    const result = repository.findOne({
      where: { symbol }
    });
    return result;
  }

  public async getBySymbolAndDate(symbol: string): Promise<boolean> {
    const repository = getCustomRepository(AssetRepository);
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

  public async getLatestUpdate(symbol: string): Promise<Asset | undefined> {
    const repository = getRepository(Asset);

    const result = await repository.findOne({
      where: { symbol },
      order: { update: 'DESC' }
    });

    return result;
  }

  public async createAndSave(obj: Asset): Promise<Asset> {
    const repository = getCustomRepository(AssetRepository);
    return repository.save(obj);
  }

  public async updateAndSave(obj: Asset): Promise<Asset> {
    const id = obj._id ?? new ObjectId();
    const idString = id instanceof ObjectId ? id.toHexString() : id;
    const repository = getCustomRepository(AssetRepository);
    repository.update(idString, obj);
    return obj;
  }
}
