import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import authConfig from '../config/auth';
import Token from '../models/tokens/Token';
import AppError from '../errors/AppError';

export default function authenticate(
    request: Request,
    response: Response,
    next: NextFunction
): void {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new AppError('JWT token is missing', 401);
    }
    const [, token] = authHeader.split(' ');
    try {
        const decoded = verify(token, authConfig.jwt.secret);
        const { sub } = decoded as Token;
        request.user = {
            id: sub
        };
        return next();
    } catch {
        throw new AppError('Invalid JWT token', 401);
    }
}
