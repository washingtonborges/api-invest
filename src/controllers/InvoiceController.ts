import Operation from '../models/Operation';
import InvoiceService from '../services/InvoiceService';

export default class PdfController {
  private InvoiceService = new InvoiceService();

  public async get(path: string): Promise<Operation[]> {
    return this.InvoiceService.Read(path);
  }
}
