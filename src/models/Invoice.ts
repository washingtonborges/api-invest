import Operation from './Operation';

export default class Invoice {
  public raw: string;

  public operations: Operation[];

  public number: number;

  public tradingDate: Date;

  public date: Date;

  public total: number;

  public totalTransaction: number;

  get tax(): number {
    return this.total - this.totalTransaction;
  }

  get taxForEachOperation(): number {
    return this.operations?.length > 0 ? this.tax / this.operations.length : 0;
  }

  constructor(
    raw: string,
    operations: Operation[],
    number: number,
    tradingDate: Date,
    date: Date,
    total: number,
    totalTransaction: number
  ) {
    this.raw = raw;
    this.operations = operations;
    this.number = number;
    this.tradingDate = tradingDate;
    this.date = date;
    this.total = total;
    this.totalTransaction = totalTransaction;
  }
}
