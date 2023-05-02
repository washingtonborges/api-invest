import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class CreateStock1682979991352 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection.db(database).collection('stock');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection.db(database).dropCollection('stock');
  }
}
