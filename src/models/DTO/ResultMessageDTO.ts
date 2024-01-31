import Stock from '../../database/models/Stock';

export default class ResultMessageDTO {
  invoice: number;

  message: string;

  stocks: Stock[];

  isSuccess: boolean;

  constructor(
    invoice: number,
    message: string,
    stocks: Stock[] = [],
    isSuccess = false
  ) {
    this.invoice = invoice;
    this.message = message;
    this.stocks = stocks;
    this.isSuccess = isSuccess;
  }
}
