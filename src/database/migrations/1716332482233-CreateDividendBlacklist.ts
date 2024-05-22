import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class CreateDividendBlacklist1716332482233
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection
      .db(database)
      .collection('dividend-blacklist');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection
      .db(database)
      .dropCollection('dividend-blacklist');
  }
}
