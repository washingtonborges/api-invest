import Price from './Price';

export default class Operation {
  line: string;

  type: string;

  symbol: string;

  price: Price;

  quantity: number;

  success: boolean;
}
