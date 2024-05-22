import { Router } from 'express';
import 'express-async-errors';
import authenticate from '../middlewares/authenticate';
import DividendController from '../controllers/DividendController';

const dividendController = new DividendController();

const DividendRouter = Router();

DividendRouter.use(authenticate);

DividendRouter.get('/', async (request, response) => {
  const userId = request.user.id;
  const date: Date = new Date(request.body.date);
  const all = await dividendController.getAllByDateAndUserId(date, userId);
  return response.status(200).json(all);
});

export default DividendRouter;
