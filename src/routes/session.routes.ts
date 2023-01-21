import { Router } from 'express';
import LoginService from '../services/LoginService';
import 'express-async-errors';

const sessionRouter = Router();

sessionRouter.post('/', async (request, response) => {
    const { username, email, password } = request.body;
    const loginService = new LoginService();
    const { validUser, token } = await loginService.login(
        username,
        email,
        password
    );
    return response.json({ validUser, token });
});

export default sessionRouter;
