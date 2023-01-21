import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class InsertProductsTest1594675043204
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection
            .db(database)
            .collection('product')
            .insertMany([
                {
                    name: 'name',
                    description: 'description',
                    color: 'color'
                },
                {
                    name: 'name 2',
                    description: 'description 2',
                    color: 'color 2'
                },
                {
                    name: 'name 3',
                    description: 'description 3',
                    color: 'color 3'
                },
                {
                    name: 'name 4',
                    description: 'description 4',
                    color: 'color 4'
                },
                {
                    name: 'name 5',
                    description: 'description 5',
                    color: 'color 5'
                },
                {
                    name: 'name 6',
                    description: 'description 6',
                    color: 'color 6'
                }
            ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection
            .db(database)
            .collection('product')
            .deleteMany({});
    }
}
