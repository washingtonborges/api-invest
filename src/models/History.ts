import Average from './Average';
import Fee from './Fee';

export default class History {
  startDate: Date;

  endDate: Date | null;

  fee: Fee;

  profitLoss: number;

  average: Average;
}
