import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import Product from '../models/Product';

@EntityRepository(Product)
export default class ProductRepository extends Repository<Product> {
  public async getAll(): Promise<Product[]> {
    const productRepository = getCustomRepository(ProductRepository);
    return productRepository.find();
  }

  public async get(id: string): Promise<Product | undefined> {
    const productRepository = getCustomRepository(ProductRepository);
    return productRepository.findOne({ _id: new ObjectId(id) });
  }

  public async createAndSave(product: Product): Promise<Product> {
    const productRepository = getCustomRepository(ProductRepository);
    return productRepository.save(product);
  }
}
