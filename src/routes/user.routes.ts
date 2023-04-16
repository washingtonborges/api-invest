import { Router } from 'express';
import UserController from '../controllers/UserController';
import User from '../models/User';
import authenticate from '../middlewares/authenticate';
import 'express-async-errors';

const userController = new UserController();

const UserRouter = Router();

UserRouter.use(authenticate);

UserRouter.get('/', async (request, response) => {
  const allUsers = await userController.getAll();
  return response.status(200).json(allUsers);
});

UserRouter.get('/:id', async (request, response) => {
  const { id } = request.params;
  const user = await userController.get(id);
  return response.status(200).json(user);
});

UserRouter.post('/', async (request, response) => {
  const newUser: User = request.body;
  const user = await userController.create(newUser);
  return response.status(201).json(user);
});

export default UserRouter;
