import Product from '../models/Product';
import ProductRepository from '../repositories/ProductRepository';
import AppError from '../errors/AppError';

export default class ProductService {
    private productRepository = new ProductRepository();

    public async getAll(): Promise<Product[]> {
        return this.productRepository.getAll();
    }

    public async get(id: string): Promise<Product | undefined> {
        if (id.length !== 24) {
            throw new AppError('The requested product was not found');
        }
        const product = this.productRepository.get(id);
        if (!product) {
            throw new AppError('The requested product was not found');
        }
        return product;
    }

    public async create(product: Product): Promise<Product> {
        return this.productRepository.createAndSave(product);
    }
}
