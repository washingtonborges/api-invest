import Latest from './Latest';
import History from './History';

export default class Position {
  symbol: string;

  name: string;

  cnpj: string;

  quantity: number;

  history: History[];

  latest: Latest;
}
