import { Router } from 'express';
import SessionRouter from './session.routes';
import UserRouter from './user.routes';
import StockRouter from './stock.routes';
import InvoiceRouter from './invoice.routes';
import AssetRouter from './asset.routes';

const routes = Router();

routes.use('/session', SessionRouter);
routes.use('/user', UserRouter);
routes.use('/stock', StockRouter);
routes.use('/invoice', InvoiceRouter);
routes.use('/asset', AssetRouter);

export default routes;
