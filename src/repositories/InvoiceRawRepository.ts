import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import InvoiceRaw from '../database/models/InvoiceRaw';

@EntityRepository(InvoiceRaw)
export default class InvoiceRawRepository extends Repository<InvoiceRaw> {
  public async getAll(): Promise<InvoiceRaw[]> {
    const repository = getCustomRepository(InvoiceRawRepository);
    return repository.find();
  }

  public async get(id: string): Promise<InvoiceRaw | undefined> {
    const repository = getCustomRepository(InvoiceRawRepository);
    return repository.findOne({ _id: new ObjectId(id) });
  }

  public async getByNumber(number: number): Promise<InvoiceRaw | undefined> {
    const repository = getCustomRepository(InvoiceRawRepository);
    return repository.findOne({ number });
  }

  public async createAndSave(invoice: InvoiceRaw): Promise<InvoiceRaw> {
    const repository = getCustomRepository(InvoiceRawRepository);
    return repository.save(invoice);
  }
}
