require('dotenv').config();

module.exports = {
  type: 'mongodb',
  database: 'invest',
  url: process.env.MONGODB_URL,
  ssl: false,
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
