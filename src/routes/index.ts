import { Router } from 'express';
import SessionRouter from './session.routes';
import UserRouter from './user.routes';
import ProductRouter from './product.routes';

const routes = Router();

routes.use('/session', SessionRouter);
routes.use('/user', UserRouter);
routes.use('/product', ProductRouter);

export default routes;
