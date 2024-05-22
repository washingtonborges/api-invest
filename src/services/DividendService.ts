import axios from 'axios';
import { parse } from 'date-fns';
import moment from 'moment';
import * as cheerio from 'cheerio';

import AppError from '../errors/AppError';
import DividendsHistoryRepository from '../repositories/DividendsHistoryRepository';
import DividendBlacklist from '../database/models/DividendBlacklist';
import DividendsHistory from '../database/models/DividendsHistory';
import Dividend from '../database/models/Dividend';
import DividendBlacklistRepository from '../repositories/DividendsBlacklistRepository';

export default class DividendService {
  private dividendsHistoryRepository = new DividendsHistoryRepository();

  private dividendBlacklistRepository = new DividendBlacklistRepository();

  async searchAndSaveDividendsHistory(
    symbol: string
  ): Promise<DividendsHistory | AppError> {
    const hasProblem = await this.dividendHasProblem(symbol);
    if (hasProblem) {
      return new AppError('Dividend has a problem', 501);
    }

    const objBlacklist = new DividendBlacklist();
    objBlacklist.symbol = symbol;
    objBlacklist.start = new Date();

    const url = this.getUrlStatusInvest(symbol);

    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
        }
      });

      const $ = cheerio.load(data);

      const inputElement = $('#results');

      if (inputElement.length > 0) {
        const jsonString = inputElement.val() as string;

        try {
          const jsonObject = JSON.parse(jsonString);

          const last = await this.dividendsHistoryRepository.getLatestUpdate(
            symbol
          );

          let dividends = jsonObject;
          if (last !== undefined) {
            dividends = jsonObject.filter((filter: { ed: string }) => {
              const limitDate = parse(filter.ed, 'dd/MM/yyyy', new Date());

              const isAfter = moment(limitDate).isAfter(
                moment(last.update),
                'day'
              );

              return isAfter;
            });
          }

          const dividendsHistory = new DividendsHistory();
          dividendsHistory.symbol = symbol;
          dividendsHistory.update = new Date();

          dividends = dividends.map(
            (dividendRaw: { ed: string; pd: string; v: number }) => {
              const dividend = new Dividend();
              dividend.limit = parse(dividendRaw.ed, 'dd/MM/yyyy', new Date());
              dividend.payment = parse(
                dividendRaw.pd,
                'dd/MM/yyyy',
                new Date()
              );
              dividend.value = dividendRaw.v;
              return dividend;
            }
          );

          if (dividends.length > 0) {
            dividendsHistory.dividend = dividends;
            this.dividendsHistoryRepository.createAndSave(dividendsHistory);
          }
          return dividendsHistory;
        } catch (error) {
          this.dividendBlacklistRepository.createAndSave(objBlacklist);
          return new AppError('Error fail parse JSON', 500);
        }
      } else {
        this.dividendBlacklistRepository.createAndSave(objBlacklist);
        return new AppError('Not found: input id "results".', 500);
      }
    } catch (error) {
      this.dividendBlacklistRepository.createAndSave(objBlacklist);
      if (axios.isAxiosError(error)) {
        return new AppError(
          `Error request website ${url} - AxiosError: ${error.message}`,
          500
        );
      }
      return new AppError(`Error request website ${url} - ${error}`, 500);
    }
  }

  public getUrlStatusInvest(symbol: string): string {
    let path = 'acoes';
    if (this.isFIISymbol(symbol)) {
      path = 'fundos-imobiliarios';
    }
    return `${process.env.STATUSINVEST_URL}/${path}/${symbol}`;
  }

  public isFIISymbol(symbol: string): boolean {
    const fiiRegex = /^[A-Za-z]{4}11$/;
    return fiiRegex.test(symbol);
  }

  public async dividendHasProblem(symbol: string): Promise<boolean> {
    const hadResearchToday = await this.dividendsHistoryRepository.getBySymbolAndDate(
      symbol
    );
    const isBlacklist = await this.dividendBlacklistRepository.isBlacklist(
      symbol
    );
    return hadResearchToday || isBlacklist;
  }
}
