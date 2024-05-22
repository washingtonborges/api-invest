import DividendService from '../services/DividendService';
import DividendsHistory from '../database/models/DividendsHistory';

export default class DividendController {
  private dividendService = new DividendService();

  public async getAllByDateAndUserId(
    date: Date,
    userId: string
  ): Promise<DividendsHistory[]> {
    return this.dividendService.getAllByDateAndUserId(date, userId);
  }
}
