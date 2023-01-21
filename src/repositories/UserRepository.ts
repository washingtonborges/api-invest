import { EntityRepository, Repository, getCustomRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import User from '../models/User';

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    public async getAll(): Promise<User[]> {
        const userRepository = getCustomRepository(UserRepository);
        return userRepository.find();
    }

    public async get(id: string): Promise<User | undefined> {
        const userRepository = getCustomRepository(UserRepository);
        return userRepository.findOne({ _id: new ObjectId(id) });
    }

    public async getByUsernameOrEmail(
        username: string,
        email: string
    ): Promise<User | undefined> {
        const userRepository = getCustomRepository(UserRepository);
        if (username) {
            return userRepository.findOne({ username });
        }
        return userRepository.findOne({ email });
    }

    public async createAndSave(user: User): Promise<User> {
        const userRepository = getCustomRepository(UserRepository);
        return userRepository.save(user);
    }
}
