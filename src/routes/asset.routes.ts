import { Router } from 'express';
import 'express-async-errors';
import authenticate from '../middlewares/authenticate';
import AssetController from '../controllers/AssetController';

const assetController = new AssetController();

const AssetRouter = Router();

AssetRouter.use(authenticate);

AssetRouter.get('/', async (request, response) => {
  const userId = request.user.id;
  const date: Date = new Date(request.body.date);
  const all = await assetController.getAllByDateAndUserId(date, userId);
  return response.status(200).json(all);
});

export default AssetRouter;
