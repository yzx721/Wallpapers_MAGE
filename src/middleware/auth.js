import AppError from "../utils/AppError.js";
import {verifyToken, verifyRefreshToken} from "../utils/jwtHelper.js";
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    try {
       if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401,'NO_TOKEN');
    }
    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    req.user = { id: payload.data };
    next();
    } catch (error) {
        next(error);
    }
}
// 可选鉴权：带有效 token 时设置 req.user，没带或 token 失效则视为匿名访问
export const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = await verifyToken(token);
        req.user = { id: payload.data };
    } catch (error) {
        // token 失效视为匿名，不拦截
    }
    next();
}
export const refreshAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    try{
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No Refresh token provided', 401,'NO_REFRESH_TOKEN');
        }
        const token = authHeader.split(' ')[1];
        const payload = await verifyRefreshToken(token);
        req.RefreshUser = payload.data;
        next();
    }catch(error){
        next(error);
    }
}