import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import Product from '../models/Product';
import 'express-async-errors';

const productController = new ProductController();

const ProductRouter = Router();

ProductRouter.get('/', async (request, response) => {
  const allProducts = await productController.getAll();
  return response.status(200).json(allProducts);
});

ProductRouter.get('/:id', async (request, response) => {
  const { id } = request.params;
  const product = await productController.get(id);
  return response.status(200).json(product);
});

ProductRouter.post('/', async (request, response) => {
  const newProduct: Product = request.body;
  const product = await productController.create(newProduct);
  return response.status(201).json(product);
});

export default ProductRouter;
