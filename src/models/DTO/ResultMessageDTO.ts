import Stock from '../../database/models/Stock';

export default class ResultMessageDTO {
  invoice: number;

  message: string;

  stocks: Stock[];

  constructor(invoice: number, message: string, stocks: Stock[] = []) {
    this.invoice = invoice;
    this.message = message;
    this.stocks = stocks;
  }
}
