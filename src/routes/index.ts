import { Router } from 'express';
import SessionRouter from './session.routes';
import UserRouter from './user.routes';
import StockRouter from './stock.routes';

const routes = Router();

routes.use('/session', SessionRouter);
routes.use('/user', UserRouter);
routes.use('/product', StockRouter);

export default routes;
