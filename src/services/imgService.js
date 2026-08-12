import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";
import path from "path";
import { handleImage } from "../utils/sharpImg.js";

// 获取瀑布流图片列表
export async function getImageList(params) {
  try {
    const { page = 1, limit = 5, sort, tags, userId, lastId } = params;
    const safeLimit = Math.min(Number(limit), 50);

    const where = {};
    if (userId) where.userId = Number(userId);
    if (lastId) where.id = { lt: Number(lastId) };
    if (tags) {
      const tagArr = Array.isArray(tags) ? tags : tags.split(',');
      where.tags = { array_contains: tagArr };
    }

    const images = await prisma.image.findMany({
      where,
      orderBy: sort === 'popular' ? { downloadCount: 'desc' } : { createdAt: 'desc' },
      take: safeLimit + 1,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const hasMore = images.length > safeLimit;
    const data = hasMore ? images.slice(0, safeLimit) : images;
    return { images: data, hasMore };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error.message, stack: error.stack, query: params }, '获取图片列表失败');
    throw new AppError('获取图片列表失败', 500);
  }
}

// 获取单张图片详情（currentUserId 可选：登录用户返回 liked，匿名返回 false）
export async function getImageDetail(imageId, currentUserId) {
  let image;
  try {
    image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true, userId: true, title: true, description: true,
        filePath: true, thumbnailPath: true, width: true, height: true,
        fileSize: true, tags: true, colorTone: true, source: true,
        apiSourceUrl: true, viewCount: true, downloadCount: true, createdAt: true,
        user: {
          select: { id: true, username: true, avatarUrl: true, bio: true, isOfficial: true },
        },
      },
    });
  } catch (error) {
    logger.error({ err: error.message, stack: error.stack, imageId }, '获取图片详情失败');
    throw new AppError('获取图片详情失败', 500);
  }

  if (!image) {
    throw new AppError('图片不存在', 404);
  }

  // 浏览量 +1
  await prisma.image.update({
    where: { id: imageId },
    data: { viewCount: { increment: 1 } },
  });
  //查询当前用户是否点赞（未登录一律 false）
  const liked = currentUserId
    ? Boolean(await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId: currentUserId,
            targetType: 'image',
            targetId: imageId
          }
        }
      }))
    : false;
  // 查询点赞数
  const likeCount = await prisma.like.count({
    where: { targetType: 'image', targetId: imageId },
  });

  return { ...image, likeCount, liked };
}

// 删除图片（先查 → 校验权限 → 再删）
export async function deleteImage(imageId, userId) {
  let image;
  try {
    image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true },
    });
  } catch (error) {
    logger.error({ err: error.message, stack: error.stack, imageId, userId }, '删除图片失败');
    throw new AppError('删除图片失败', 500);
  }

  if (!image) {
    throw new AppError('图片不存在', 404);
  }
  if (image.userId !== userId) {
    throw new AppError('无权删除此图片', 403);
  }

  await prisma.image.delete({ where: { id: imageId } });
  return { message: '图片已删除' };
}

// 上传图片
export async function uploadImage(imageData) {
  const { file, userId, title, description, tags } = imageData;
  const { width, height, thumbRelativePath } = await handleImage(file.path, file.filename);
  const newImage = await prisma.image.create({
    data: {
      userId,
      title,
      description,
      filePath: `/uploads/${file.filename}`,
      thumbnailPath: thumbRelativePath,
      width,
      height,
      fileSize: file.size,
      tags: tags ? tags.split(',') : [],
      source: 'upload',
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  return newImage;
}