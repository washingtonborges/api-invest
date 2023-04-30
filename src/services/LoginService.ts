import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository';
import authConfig from '../config/auth';
import AppError from '../errors/AppError';

export default class LoginService {
  private userRepository = new UserRepository();

  public async login(
    username: string,
    email: string,
    password: string
  ): Promise<string> {
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
    const { secret, expiresIn } = await authConfig.jwt;
    const payload = {
      id: validUser._id,
      email: validUser.email,
      name: validUser.name
    };
    const token = sign(payload, secret, {
      subject: validUser._id.toString(),
      expiresIn
    });
    return token;
  }
}
