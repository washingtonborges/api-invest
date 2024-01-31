import { Router } from 'express';
import StockController from '../controllers/StockController';
import Stock from '../database/models/Stock';
import 'express-async-errors';
import authenticate from '../middlewares/authenticate';

const stockController = new StockController();

const StockRouter = Router();

StockRouter.use(authenticate);

StockRouter.get('/', async (request, response) => {
  const allStocks = await stockController.getAll();
  return response.status(200).json(allStocks);
});

StockRouter.get(':id', async (request, response) => {
  const { id } = request.params;
  const stock = await stockController.get(id);
  return response.status(200).json(stock);
});

StockRouter.post('/', async (request, response) => {
  const newStock: Stock = request.body;
  const stock = await stockController.create(newStock);
  return response.status(201).json(stock);
});

StockRouter.post('/import/', async (request, response) => {
  const files: string[] = request.body;
  const result = await stockController.import(files);
  return response.status(200).json(result);
});

StockRouter.get('/grouped/', async (request, response) => {
  const allStocks = await stockController.getAllGrouped();
  return response.status(200).json(allStocks);
});

export default StockRouter;
