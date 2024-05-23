import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import Blacklist from '../database/models/Blacklist';

@EntityRepository(Blacklist)
export default class BlacklistRepository extends Repository<Blacklist> {
  public async isBlacklist(symbol: string): Promise<boolean> {
    const repository = getCustomRepository(BlacklistRepository);
    const result = await repository.find({ symbol });
    return result.length > 0;
  }

  public async createAndSave(obj: Blacklist): Promise<Blacklist> {
    const repository = getCustomRepository(BlacklistRepository);
    return repository.save(obj);
  }
}
