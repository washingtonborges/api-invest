import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import DividendBlacklist from '../database/models/DividendBlacklist';

@EntityRepository(DividendBlacklist)
export default class DividendBlacklistRepository extends Repository<
  DividendBlacklist
> {
  public async isBlacklist(symbol: string): Promise<boolean> {
    const repository = getCustomRepository(DividendBlacklistRepository);
    const result = await repository.find({ symbol });
    return result.length > 0;
  }

  public async createAndSave(
    obj: DividendBlacklist
  ): Promise<DividendBlacklist> {
    const repository = getCustomRepository(DividendBlacklistRepository);
    return repository.save(obj);
  }
}
