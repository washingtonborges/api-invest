/* eslint-disable no-console */
import express, { Request, Response, NextFunction } from 'express';
import routes from './routes';
import './database';
import AppError from './errors/AppError';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use(routes);

app.use(
  (error: Error, request: Request, response: Response, _: NextFunction) => {
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    console.log(error);
    return response.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
);

app.listen(3333, () => {
  console.log('🦘 Server started on port 3333...');
});
