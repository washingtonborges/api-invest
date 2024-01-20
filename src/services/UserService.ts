import { hash } from 'bcryptjs';
import User from '../database/models/User';
import UserRepository from '../repositories/UserRepository';
import AppError from '../errors/AppError';

export default class UserService {
  private userRepository = new UserRepository();

  public async getAll(): Promise<User[]> {
    return this.userRepository.getAll();
  }

  public async get(id: string): Promise<User | undefined> {
    if (id.length !== 24) {
      throw new AppError('The requested user was not found', 404);
    }
    const user = this.userRepository.get(id);
    if (!user) {
      throw new AppError('The requested user was not found', 404);
    }
    return user;
  }

  public async create(user: User): Promise<User> {
    const userExist = await this.userRepository.getByUsernameOrEmail(
      user.username,
      user.email
    );
    if (userExist) {
      throw new AppError('The user already exists');
    }
    user.password = await this.generatePassword(user.password);
    return this.userRepository.createAndSave(user);
  }

  private generatePassword(plainTextPassword: string): Promise<string> {
    return hash(plainTextPassword, 10);
  }
}
