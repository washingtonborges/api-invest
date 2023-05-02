import { Router } from 'express';
import StockController from '../controllers/StockController';
import Stock from '../models/Stock';
import 'express-async-errors';

const stockController = new StockController();

const StockRouter = Router();

StockRouter.get('/', async (request, response) => {
  const allStocks = await stockController.getAll();
  return response.status(200).json(allStocks);
});

StockRouter.get('/:id', async (request, response) => {
  const { id } = request.params;
  const stock = await stockController.get(id);
  return response.status(200).json(stock);
});

StockRouter.post('/', async (request, response) => {
  const newStock: Stock = request.body;
  const stock = await stockController.create(newStock);
  return response.status(201).json(stock);
});

export default StockRouter;
