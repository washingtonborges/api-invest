import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class InsertStock1682980005290 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection
      .db(database)
      .collection('stock')
      .insertMany([
        {
          symbol: 'ABEV3',
          quantity: 100,
          date: '20/03/2023',
          price: 5,
          fee: 1,
          operation: true
        },
        {
          symbol: 'ABEV3',
          quantity: 100,
          date: '20/03/2023',
          price: 8,
          fee: 1,
          operation: false
        }
      ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const mongoRunner = queryRunner as MongoQueryRunner;
    const database = (await getConnectionOptions()).database as string;
    await mongoRunner.databaseConnection
      .db(database)
      .collection('stock')
      .deleteMany({});
  }
}
