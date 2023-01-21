import ProductService from '../services/ProductService';
import Product from '../models/Product';

export default class ProductController {
    private ProductService = new ProductService();

    public async getAll(): Promise<Product[]> {
        return this.ProductService.getAll();
    }

    public async get(id: string): Promise<Product | undefined> {
        return this.ProductService.get(id);
    }

    public async create(product: Product): Promise<Product> {
        return this.ProductService.create(product);
    }
}
