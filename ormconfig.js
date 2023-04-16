require('dotenv').config();

module.exports = {
  type: 'mongodb',
  url: process.env.MONGODB_URL,
  ssl: true,
  useNewUrlParser: true,
  synchronize: true,
  logging: true,
  useUnifiedTopology: true,
  entities: ['./src/models/*.ts'],
  migrations: ['./src/database/migrations/*.ts'],
  cli: {
    migrationsDir: '/src/database/migrations'
  }
};
