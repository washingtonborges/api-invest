import UserService from '../services/UserService';
import User from '../models/User';

export default class UserController {
    private UserService = new UserService();

    public async getAll(): Promise<User[]> {
        return this.UserService.getAll();
    }

    public async get(id: string): Promise<User | undefined> {
        return this.UserService.get(id);
    }

    public async create(user: User): Promise<User> {
        return this.UserService.create(user);
    }
}
