import { readPdfText } from 'pdf-text-reader';
import { parse } from 'date-fns';
import Price from '../models/Price';
import Operation from '../models/Operation';
import Invoice from '../models/Invoice';
import Settlement from '../models/Settlement';
import Stock from '../database/models/Stock';
import InvoiceRawRepository from '../repositories/InvoiceRawRepository';
import InvoiceRaw from '../database/models/InvoiceRaw';

export default class InvoiceService {
  private invoiceRawRepository = new InvoiceRawRepository();

  public async readByPath(path: string): Promise<Invoice> {
    const text: string = await readPdfText({ url: path });
    return this.get(text);
  }

  public async readByData(buffer: ArrayBufferLike): Promise<Invoice> {
    const text: string = await readPdfText({ data: buffer });
    return this.get(text);
  }

  public convertFilesArrayStringToByte(files: string[]): Uint8Array[] {
    const arrayBytes: Uint8Array[] = [];
    files.forEach((file: string) => {
      const base64String = file.split(';base64,').pop() ?? '';
      const bytes = new Uint8Array(
        atob(base64String)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      arrayBytes.push(bytes);
    });
    return arrayBytes;
  }

  public convertToStock(invoice: Invoice): Stock[] {
    const list: Stock[] = invoice.operations.map(operation => {
      return {
        invoice: invoice.number,
        date: invoice.tradingDate,
        symbol: operation.symbol,
        quantity: operation.quantity,
        total: operation.price.total,
        unit: operation.price.unitary,
        fee: invoice.taxForEachOperation,
        operation: operation.type === 'Buy'
      } as Stock;
    });
    return list;
  }

  public createAndSaveInvoiceRaw(invoice: Invoice): Promise<InvoiceRaw> {
    const invoiceRaw: InvoiceRaw = {
      content: JSON.stringify(invoice),
      dateReader: new Date(),
      number: invoice.number
    } as InvoiceRaw;
    return this.invoiceRawRepository.createAndSave(invoiceRaw);
  }

  public async existInvoiceRawByNumber(number: number): Promise<boolean> {
    let result = false;
    const raw = await this.invoiceRawRepository.getByNumber(number);
    if (raw) {
      result = true;
    }
    return result;
  }

  private get(text: string): Invoice {
    const operations = this.getOperations(text);
    const settlement = this.getSettlement(text);
    const trandingDate = this.getTrandingDate(text);
    const number = this.getNumber(text);
    const total = this.getTotal(text);
    const invoice = new Invoice(
      text,
      operations,
      number,
      trandingDate,
      settlement,
      total
    );
    return invoice;
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
    const operation = new Operation(
      text,
      this.getOperationType(text),
      this.getSymbol(text),
      this.getPrices(text),
      this.getQuantity(text),
      false
    );
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

  private getSettlement(text: string): Settlement {
    const date = this.getSettlementDate(text);
    const price = this.getSettlementPrice(text);
    const tax = this.getSettlementTax(text);
    const total = this.getSettlementTotal(text);
    return new Settlement(date, price, total, tax);
  }

  private getSettlementDate(text: string): Date {
    const regex = new RegExp(/Líquido para (\d{2}\/\d{2}\/\d{4})/);
    const matches = this.getArrayByRegExp(text, regex);
    let date: Date = new Date();

    if (matches && matches.length > 0) {
      date = parse(matches[1], 'dd/MM/yyyy', new Date());
    }
    return date;
  }

  private getSettlementPrice(text: string): number {
    const regex = new RegExp(/Valor Líquido das Operações (\S+)\n\nCompras/);
    const matches = this.getArrayByRegExp(text, regex);
    let price = 0;

    if (matches && matches.length > 0) {
      price = parseFloat(matches[1].replace(/\./g, '').replace(',', '.'));
    }
    return price;
  }

  private getSettlementTax(text: string): number {
    const regex = new RegExp('Taxa de Liquidação (-?\\d+(?:,\\d{2})?)');
    const matches = this.getArrayByRegExp(text, regex);
    let tax = 0;

    if (matches && matches.length > 0) {
      tax = parseFloat(matches[1].replace(/\./g, '').replace(',', '.'));
    }
    return tax;
  }

  private getSettlementTotal(text: string): number {
    const match: RegExpMatchArray | null = text.match(/ (\S+)\n\nOperações/);
    let price = 0;
    if (match !== null) {
      const monetaryValue: string = match[1];
      const middleIndex: number = Math.floor(monetaryValue.length / 2);

      const leftPart: string = monetaryValue.slice(0, middleIndex);
      const rightPart: string = monetaryValue.slice(middleIndex);

      if (leftPart === rightPart) {
        price = parseFloat(leftPart.replace(/\./g, '').replace(',', '.'));
      }
    }
    return price;
  }

  private getTrandingDate(text: string): Date {
    const regex = new RegExp(/(\d{2}\/\d{2}\/\d{4})/);
    const matches = this.getArrayByRegExp(text, regex);
    let date: Date = new Date();

    if (matches && matches.length > 0) {
      date = parse(matches[1], 'dd/MM/yyyy', new Date());
    }
    return date;
  }

  private getNumber(text: string): number {
    const regexOldVersion = new RegExp(/Cidade\s+(\d+)/);
    const regexNewVersion = new RegExp(/Pinheiros\s+(\d+)/);

    let matches = this.getArrayByRegExp(text, regexOldVersion);
    if (matches.length === 0) {
      matches = this.getArrayByRegExp(text, regexNewVersion);
    }

    let number = 0;

    if (matches && matches.length > 0) {
      number = parseFloat(matches[1]);
    }
    return number;
  }

  private getTotal(text: string): number {
    const match: RegExpMatchArray | null = text.match(/ (\S+)\nL - Precatório/);
    let price = 0;
    if (match !== null) {
      const monetaryValue: string = match[1];
      const middleIndex: number = Math.floor(monetaryValue.length / 2);

      const leftPart: string = monetaryValue.slice(0, middleIndex);
      const rightPart: string = monetaryValue.slice(middleIndex);

      if (leftPart === rightPart) {
        price = parseFloat(leftPart.replace(/\./g, '').replace(',', '.'));
      }
    }
    return price;
  }
}
