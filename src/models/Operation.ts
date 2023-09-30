import Price from './Price';

export default class Operation {
  line: string;

  type: string;

  symbol: string;

  price: Price;

  quantity: number;

  success: boolean;

  constructor(
    line: string,
    type: string,
    symbol: string,
    price: Price,
    quantity: number,
    success: boolean
  ) {
    this.line = line;
    this.type = type;
    this.symbol = symbol;
    this.price = price;
    this.quantity = quantity;
    this.success = success;
  }
}
