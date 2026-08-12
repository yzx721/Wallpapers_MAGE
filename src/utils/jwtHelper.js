import * as jose from 'jose';
import { SignJWT, jwtVerify } from "jose";
import dotenv from "dotenv";
dotenv.config();
import AppError from "./AppError.js";
// 密钥转Uint8Array（Jose强制要求）
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
const ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE;
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE;
//加密方式
const alg="HS256";
export async function generateAccessToken(data) {
  const token =await new jose.SignJWT({ data })
    .setProtectedHeader({ alg })
     .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRE)
    .sign(ACCESS_SECRET);
  return token;
}
export async function generateRefreshToken(data) {
  const token =await new jose.SignJWT({ data })
    .setProtectedHeader({ alg })
     .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRE)
    .sign(REFRESH_SECRET);
  return token;
}
export async function verifyToken(token) {
  try {
    const result = await jose.jwtVerify(token, ACCESS_SECRET);
    return result.payload;
  } catch (error) {
    throw new AppError(error.message || 'Invalid token', 401, error.name || "JWT_ERROR");
  }
}
export async function verifyRefreshToken(token){
    try {
        const result = await jose.jwtVerify(token, REFRESH_SECRET);
        return result.payload;
    } catch (error) {
        throw new AppError(error.message || 'Invalid token', 401, error.name || "JWT_ERROR");
    }
}
