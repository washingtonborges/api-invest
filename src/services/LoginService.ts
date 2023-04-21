import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository';
import authConfig from '../config/auth';
import AppError from '../errors/AppError';
import UserToken from '../models/tokens/UserToken';

export default class LoginService {
  private userRepository = new UserRepository();

  public async login(
    username: string,
    email: string,
    password: string
  ): Promise<UserToken> {
    const validUser = await this.userRepository.getByUsernameOrEmail(
      username,
      email
    );
    if (!validUser) {
      throw new AppError('Wrong password or email/username', 401);
    }
    const passwordMatched = await compare(password, validUser.password);
    if (!passwordMatched) {
      throw new AppError('Wrong password or email/username', 401);
    }
    const { secret, expiresIn } = authConfig.jwt;
    const token = sign({}, secret, {
      subject: validUser._id.toString(),
      expiresIn
    });
    return { validUser, token };
  }
}
