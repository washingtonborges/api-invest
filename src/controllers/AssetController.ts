import AssetService from '../services/AssetService';
import Asset from '../database/models/Asset';

export default class AssetController {
  private assetService = new AssetService();

  public async getAllByDateAndUserId(
    date: Date,
    userId: string
  ): Promise<Asset[]> {
    return this.assetService.getAllByDateAndUserId(date, userId);
  }
}
