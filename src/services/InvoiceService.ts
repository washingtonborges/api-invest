import { readPdfText } from 'pdf-text-reader';
import Price from '../models/Price';
import Operation from '../models/Operation';

export default class PdfService {
  public async Read(path: string): Promise<Operation[]> {
    const text: string = await readPdfText({ url: path });
    return this.getOperations(text);
  }

  private getOperations(text: string): Operation[] {
    const operations: Operation[] = [];
    const operationsRaw = this.getOperationRaw(text);

    operationsRaw.forEach(line => {
      const operation = this.getOperation(line);
      operations.push(operation);
    });

    return operations;
  }

  private getOperationRaw(text: string): string[] {
    const regex = new RegExp(/^BOVESPA [CV].*$/gm);
    return this.getArrayByRegExp(text, regex);
  }

  private getArrayByRegExp(text: string, regExp: RegExp): string[] {
    const result: string[] = [];
    const isMatch: boolean = regExp.test(text);
    if (isMatch) {
      const matches: RegExpMatchArray | null = text.match(regExp);
      if (matches) {
        matches.forEach(match => {
          result.push(match);
        });
      }
    }
    return result;
  }

  private getOperation(text: string): Operation {
    const price: Price = {
      unitary: 0,
      total: 0
    };

    const operation: Operation = {
      line: '',
      type: '',
      symbol: '',
      price,
      quantity: 0,
      success: false
    };

    operation.line = text;
    operation.type = this.getOperationType(text);
    operation.symbol = this.getSymbol(text);
    operation.price = this.getPrices(text);
    operation.quantity = this.getQuantity(text);
    operation.success = this.isSuccess(
      operation.price.unitary,
      operation.quantity,
      operation.price.total
    );

    return operation;
  }

  private getOperationType(text: string): string {
    const regex = new RegExp(/BOVESPA [CV]/);
    let operationType = '';
    const match = this.getArrayByRegExp(text, regex);
    if (match && match.length > 0) {
      const lastChar: string = match[0][match[0].length - 1];
      operationType = lastChar === 'C' ? 'Buy' : 'Sell';
    }
    return operationType;
  }

  private getSymbol(text: string): string {
    const regex = new RegExp(/\b[A-Z0-9]{4}\d[A-Z0-9]?\b/);
    let symbol = '';
    const match = this.getArrayByRegExp(text, regex);
    if (match && match.length > 0) {
      [symbol] = match;
    }
    return symbol;
  }

  private getPrices(text: string): Price {
    const regex = new RegExp(/\d{1,3}(?:\.\d{3})*(?:,\d{2})/g);
    const price: Price = {
      unitary: 0,
      total: 0
    };
    const matches = this.getArrayByRegExp(text, regex);
    if (matches && matches.length === 2) {
      let stringUnitary = '';
      let stringTotal = '';
      [stringUnitary, stringTotal] = matches;
      price.unitary = parseFloat(
        stringUnitary.replace(/\./g, '').replace(',', '.')
      );
      price.total = parseFloat(
        stringTotal.replace(/\./g, '').replace(',', '.')
      );
    }
    return price;
  }

  private getQuantity(text: string): number {
    const regex = new RegExp(/(\d+) (?=\d{1,3}(?:\.\d{3})*(?:,\d{2}))/);
    let quantity = 0;
    const matches = this.getArrayByRegExp(text, regex);
    if (matches && matches.length > 1) {
      const [parsedQuantity] = matches;
      quantity = parseInt(parsedQuantity, 10);
    }
    return quantity;
  }

  private isSuccess(
    unitaryPrice: number,
    quantity: number,
    totalPrice: number
  ): boolean {
    let sum = unitaryPrice * quantity;
    sum = parseFloat(sum.toFixed(2));
    const result = sum === totalPrice;
    return result;
  }
}
