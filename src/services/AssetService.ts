import axios from 'axios';
import { parse } from 'date-fns';
import moment from 'moment';
import * as cheerio from 'cheerio';

import AppError from '../errors/AppError';
import AssetRepository from '../repositories/AssetRepository';
import Asset from '../database/models/Asset';
import Dividend from '../database/models/Dividend';
import BlacklistRepository from '../repositories/BlacklistRepository';
import StockService from './StockService';
import DividendRepository from '../repositories/DividendRepository';
import Blacklist from '../database/models/Blacklist';

export default class AssetService {
  private assetRepository = new AssetRepository();

  private blacklistRepository = new BlacklistRepository();

  private dividendRepository = new DividendRepository();

  private stockService = new StockService();

  async getAllByDateAndUserId(date: Date, userId: string): Promise<Asset[]> {
    const symbols = await this.stockService.getSymbolByDateAndUserId(
      date,
      userId
    );
    const assets = await Promise.all(
      symbols.map(async (symbol: string) => {
        const result = await this.searchAndSaveAssets(symbol);
        let asset = new Asset();
        asset.symbol = symbol;
        if (result instanceof AppError) {
          const resultGet = await this.assetRepository.getBySymbol(symbol);
          if (resultGet !== undefined) {
            asset = resultGet;
          }
        } else if (result instanceof Asset) {
          asset = result;
        }
        return asset;
      })
    );

    return assets;
  }

  async searchAndSaveAssets(symbol: string): Promise<Asset | AppError> {
    const hasProblem = await this.assetHasProblem(symbol);
    if (hasProblem) {
      return new AppError('Asset has a problem', 501);
    }

    const objBlacklist = new Blacklist();
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

      let cnpj = '';
      let name = '';
      if (this.isFIISymbol(symbol)) {
        cnpj = $('h3.title:contains("CNPJ")').next('strong.value').text();
        name = $('h3.title:contains("Nome Pregão")')
          .next('div')
          .find('strong.value')
          .text();
      } else {
        const companyDescription = $('.company-description');
        name = companyDescription
          .find('h4.mb-2 span.d-block.fw-600.text-main-green-dark')
          .text()
          .trim();
        cnpj = companyDescription
          .find('h4.mb-2 small.d-block.fs-4.fw-100.lh-4')
          .text()
          .trim();
      }

      const inputElement = $('#results');

      if (inputElement.length > 0) {
        const jsonString = inputElement.val() as string;

        try {
          const jsonObject = JSON.parse(jsonString);

          const last = await this.assetRepository.getLatestUpdate(symbol);

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

          const asset = new Asset();
          asset.symbol = symbol;
          asset.name = name;
          asset.cnpj = cnpj;
          asset.update = new Date();

          let savedHistory = await this.assetRepository.createAndSave(asset);

          dividends = await Promise.all(
            dividends.map(
              async (dividendRaw: { ed: string; pd: string; v: number }) => {
                const dividend = new Dividend();
                dividend.limit = parse(
                  dividendRaw.ed,
                  'dd/MM/yyyy',
                  new Date()
                );
                dividend.payment = parse(
                  dividendRaw.pd,
                  'dd/MM/yyyy',
                  new Date()
                );
                dividend.value = dividendRaw.v;
                const newDividend = await this.dividendRepository.createAndSave(
                  dividend
                );
                return newDividend;
              }
            )
          );

          if (dividends.length > 0) {
            savedHistory.dividend = dividends;
            savedHistory = await this.assetRepository.updateAndSave(
              savedHistory
            );
          }

          return savedHistory;
        } catch (error) {
          this.blacklistRepository.createAndSave(objBlacklist);
          return new AppError('Error fail parse JSON', 500);
        }
      } else {
        this.blacklistRepository.createAndSave(objBlacklist);
        return new AppError('Not found: input id "results".', 500);
      }
    } catch (error) {
      this.blacklistRepository.createAndSave(objBlacklist);
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

  public async assetHasProblem(symbol: string): Promise<boolean> {
    const hadResearchToday = await this.assetRepository.getBySymbolAndDate(
      symbol
    );
    const isBlacklist = await this.blacklistRepository.isBlacklist(symbol);
    return hadResearchToday || isBlacklist;
  }
}
