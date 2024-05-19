import Invoice from '../models/Invoice';
import InvoiceService from '../services/InvoiceService';

export default class InvoiceController {
  private InvoiceService = new InvoiceService();

  public async get(path: string): Promise<Invoice> {
    return this.InvoiceService.readByPath(path);
  }
}
