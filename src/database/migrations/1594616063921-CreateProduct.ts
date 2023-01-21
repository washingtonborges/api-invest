import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class CreateProduct1594616063921 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection.db(database).collection('product');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection
            .db(database)
            .dropCollection('product');
    }
}
