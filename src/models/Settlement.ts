export default class Settlement {
  date: Date;

  price: number;

  total: number;

  tax: number;

  constructor(date: Date, price: number, total: number, tax: number) {
    this.date = date;
    this.price = price;
    this.total = total;
    this.tax = tax;
  }
}
