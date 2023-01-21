import { MigrationInterface, QueryRunner, getConnectionOptions } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export default class InsertUser1595119921678 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection
            .db(database)
            .collection('user')
            .insertMany([
                {
                    name: 'Rufus Stock',
                    username: 'rufus',
                    email: 'test@rufus.com.br',
                    password:
                        '$2b$10$uVyzAH9UtCP5Gl26HcSIAeT.bTJ3y.MUMUAbh0A.vHZyXyydS4JpC' // plainText=>123
                }
            ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const mongoRunner = queryRunner as MongoQueryRunner;
        const database = (await getConnectionOptions()).database as string;
        await mongoRunner.databaseConnection
            .db(database)
            .collection('user')
            .deleteMany({});
    }
}
