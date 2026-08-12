import AppError from '../utils/AppError.js';
import{ 
    sendNotFoundResponse,
    sendSuccessResponse,
}from '../utils/responseHelper.js';
import{ 
    register as registerApi, 
    login as loginApi,
    getUserById as getUserByIdApi,
    getUserWork as getUserWorkApi
} from '../services/UserService.js';
export async function registerUser(req, res) {
    const { username, email, password } = req.body;
    const { user, accessToken, refreshToken } = await registerApi(username, password, email);
    return res.status(201).json({
        message: 'User registered successfully',
        data: {
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken
        },
    });
}
export async function loginUser(req, res) {
    const { username, password } = req.body;
    const { user, accessToken, refreshToken } = 
    await loginApi(username, password);
    const loginData = {
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken
    };
    return sendSuccessResponse(res, loginData, 'Login successful');
}
export async function getUserById(req, res) {
    const { id } = req.params;
    const user = await getUserByIdApi(Number(id));
    return sendSuccessResponse(res, user, 'User found');
}
export async function getUserWork(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const workData = await getUserWorkApi({ id: Number(id), page: Number(page), limit: Number(limit) });
    return sendSuccessResponse(res, workData, 'User work retrieved successfully');
}

