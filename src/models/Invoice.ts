import Operation from './Operation';
import Settlement from './Settlement';

export default class Invoice {
  public raw: string;

  public operations: Operation[];

  public number: number;

  public tradingDate: Date;

  public settlement: Settlement;

  public totalTransaction: number;

  public tax: number;

  public taxForEachOperation: number;

  private calculateTax(): number {
    return this.settlement.price - this.totalTransaction;
  }

  private calculateTaxForEachOperation(): number {
    return this.operations?.length > 0
      ? this.calculateTax() / this.operations.length
      : 0;
  }

  constructor(
    raw: string,
    operations: Operation[],
    number: number,
    tradingDate: Date,
    settlement: Settlement,
    totalTransaction: number
  ) {
    this.raw = raw;
    this.operations = operations;
    this.number = number;
    this.tradingDate = tradingDate;
    this.settlement = settlement;
    this.totalTransaction = totalTransaction;
    this.tax = parseFloat(this.calculateTax().toFixed(2));
    this.taxForEachOperation = parseFloat(
      this.calculateTaxForEachOperation().toFixed(2)
    );
  }
}
