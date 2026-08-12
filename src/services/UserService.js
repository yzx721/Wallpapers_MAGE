import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtHelper.js";
import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
export async function register(username, password, email) {
  // 校验用户名/邮箱是否已存在
  const existUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
  if (existUser) throw new AppError("用户名或邮箱已被注册", 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: hashedPassword,
      email,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  const accessToken = await generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

export async function login(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) {
    throw new AppError("用户名或密码错误", 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("用户名或密码错误", 401);
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  const accessToken = await generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}
//TODO: 这里可以考虑增加缓存还有记得添加计算用户点赞总数,redis
// 缓存用户信息，减少数据库查询压力
export async function getUserById(userId) {
  if(!userId){
    throw new AppError("用户ID不能为空", 400);
  }
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      isOfficial: true,
      createdAt: true,
      _count: {
        select: {
          albums: true,
          images: true,
          linkPosts: true,
        }
      }
    },
  });
  if (!user) {
    throw new AppError("该用户不存在", 404);
  }
  return user;
}

/**
 * 获取用户作品（图片+相册混合精准分页）
 * @param {Object} params - 请求参数
 * @param {number|string} params.id - 用户ID
 * @param {number|string} [params.page=1] - 页码
 * @param {number|string} [params.limit=10] - 每页条数
 * @returns {Promise<Object>} 作品列表+分页信息
 */
export async function getUserWork(params) {
try{
    const { id, page = 1, limit = 10 } = params;

  // 1. 参数格式化与校验
  const userId = Number(id);
  const pageNum = Number(page);
  const limitNum = Number(limit);
  if (isNaN(userId) || userId <= 0) throw new AppError("用户ID非法", 400);
  if (isNaN(pageNum) || pageNum < 1) throw new AppError("页码不能小于1", 400);
  if (isNaN(limitNum) || limitNum < 1) throw new AppError("每页条数非法", 400);

  // 限制最大50条，计算偏移量
  const safeLimit = Math.min(limitNum, 50);
  const offset = (pageNum - 1) * safeLimit;

  // 2. UNION合并图片、相册，全局统一排序分页
  // 注意：裸 SQL 用真实列名（snake_case），Prisma @map 把 camelCase 字段映射到下划线列
  const workListRaw = await prisma.$queryRaw`
    SELECT id,title,file_path AS cover,NULL AS description,created_at,view_count,'image' AS type
    FROM images WHERE user_id = ${userId}
    UNION ALL
    SELECT a.id,a.title,i.file_path AS cover,a.description,a.created_at,a.view_count,'album' AS type
    FROM albums a LEFT JOIN images i ON a.cover_image_id = i.id
    WHERE a.user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `;

  // 3. 查询作品总数量
  const countRaw = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM images WHERE user_id = ${userId}) AS imageCount,
      (SELECT COUNT(*) FROM albums WHERE user_id = ${userId}) AS albumCount
  `;
  const { imageCount, albumCount } = countRaw[0];
  const total = Number(imageCount) + Number(albumCount);

  // 4. 格式化数据，BigInt转数字
  const list = workListRaw.map(item => ({
    id: Number(item.id),
    title: item.title,
    cover: item.cover,
    description: item.description,
    createdAt: item.createdAt,
    viewCount: Number(item.viewCount),
    type: item.type
  }));
  // 返回列表+分页数据
  return {
    list,
    pagination: {
      page: pageNum,
      limit: safeLimit,
      total,
      totalPage: Math.ceil(total / safeLimit)
    }
  };
}catch (error) {
    console.log('获取用户作品失败:', error);
  }
}
