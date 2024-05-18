import { Router } from 'express';
import StockController from '../controllers/StockController';
import Stock from '../database/models/Stock';
import 'express-async-errors';
import authenticate from '../middlewares/authenticate';
import LatestQuote from '../database/models/LatestQuote';

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

StockRouter.post('/grouped/', async (request, response) => {
  const date: Date = new Date(request.body.date);
  const { isLatestQuote } = request.body;
  const { isCurrentPosition } = request.body;
  const allStocks = await stockController.getAllGrouped(
    date,
    isLatestQuote,
    isCurrentPosition
  );
  return response.status(200).json(allStocks);
});

StockRouter.post('/updatelatestquote/', async (request, response) => {
  const latestQuote: LatestQuote = request.body;
  latestQuote.date = new Date(latestQuote.date);
  const result = await stockController.updateLatestQuote(latestQuote);
  return response.status(200).json(result);
});

export default StockRouter;
