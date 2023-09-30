import { Router } from 'express';
import InvoiceController from '../controllers/InvoiceController';
import 'express-async-errors';

const invoiceController = new InvoiceController();

const invoiceRouter = Router();

invoiceRouter.get('/', async (request, response) => {
  const { path } = request.body;
  const invoice = await invoiceController.get(path);
  return response.json({ invoice });
});

export default invoiceRouter;
