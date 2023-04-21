/* eslint-disable no-console */
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import './database';
import AppError from './errors/AppError';

dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.FRONT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);
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
  console.log('🦁 Server started on port 3333...');
});
