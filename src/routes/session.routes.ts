import { Router } from 'express';
import LoginService from '../services/LoginService';
import 'express-async-errors';

const sessionRouter = Router();

sessionRouter.post('/', async (request, response) => {
  const { username, email, password } = request.body;
  const loginService = new LoginService();
  const token = await loginService.login(username, email, password);
  return response.json({ token });
});

export default sessionRouter;
