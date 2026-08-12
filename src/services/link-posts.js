import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";
export async function getLinkPosts(params) {
    try {
        const {
            page = 1, limit = 10,
            userId, tags, sort = 'createdAt_desc'
        } = params;
        const safeLimit = Math.min(Number(limit), 50);
        const [sortField, sortOrder] = sort.split("_");
        const orderBy = { [sortField]: sortOrder };

        const where = {};
        if (userId) where.userId = Number(userId);
        if (tags) {
            const tagArr = Array.isArray(tags) ? tags : tags.split(',');
            where.tags = { array_contains: tagArr };
        }

        const list = await prisma.linkPost.findMany({
            where,
            orderBy,
            take: safeLimit,
            skip: (Number(page) - 1) * safeLimit,
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                previewImage: true
            }
        });
        const total = await prisma.linkPost.count({ where });
        // 批量统计这些链接帖的点赞数（likes 表里 targetType='link_post'），合并进列表
        const ids = list.map((lp) => lp.id);
        const likeRows = ids.length
            ? await prisma.like.groupBy({
                by: ['targetId'],
                where: { targetType: 'link_post', targetId: { in: ids } },
                _count: { _all: true },
            })
            : [];
        const likeMap = new Map(likeRows.map((r) => [r.targetId, r._count._all]));
        const data = list.map((lp) => ({ ...lp, likeCount: likeMap.get(lp.id) || 0 }));
        const pagination = {
            page: Number(page),
            limit: safeLimit,
            total,
            totalPage: Math.ceil(total / safeLimit)
        };
        return { list: data, pagination };
    } catch (error) {
        logger.error({ err: error.message, stack: error.stack }, '获取链接帖列表失败');
        throw new AppError('获取链接帖列表失败', 500);
    }
}
export async function getLinkPostDetail(id,currentUserId) {
    try {
        const linkPostDetail = await prisma.linkPost.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                previewImage: true
            }
        });
        if (!linkPostDetail) {
            throw new AppError('链接帖子不存在', 404);
        }
        await prisma.linkPost.update({
            where: { id: Number(id) },
            data: { viewCount: { increment: 1 } }
        });
        //查询当前用户是否点赞（未登录一律 false）
        const liked = currentUserId
            ? Boolean(await prisma.like.findUnique({
                where: {
                userId_targetType_targetId: {
                    userId: currentUserId,
                    targetType: 'link_post',
                    targetId: Number(id)
                }
                }
            }))
            : false;
        // 查询点赞数
        const likeCount = await prisma.like.count({
            where: { targetType: 'link_post', targetId: Number(id) },
        });
        return { ...linkPostDetail, likeCount, liked };
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error({ err: error.message, stack: error.stack }, '获取链接帖详情失败');
        throw new AppError('获取链接帖详情失败', 500);
    }
}
export async function createLinkPost(data) {
    const {
        userId, title, description,
        linkType, tags,
        linkUrl, linkPassword, previewImageId
    } = data;
    const validLinkTypes = ['baidu', 'aliyun', 'quark', 'other'];
    if (linkType && !validLinkTypes.includes(linkType)) {
        throw new AppError('无效的链接类型', 400);
    }
    let parsedTags = tags;
    if (typeof tags === 'string') {
        parsedTags = tags.split(',').filter(Boolean);
    }
    try {
        const newLinkPost = await prisma.linkPost.create({
            data: {
                userId,
                title,
                description,
                linkType,
                tags: parsedTags,
                linkUrl,
                linkPassword,
                previewImageId,
                viewCount: 0,
            },
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                previewImage: true
            }
        });
        return newLinkPost;
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error({ err: error.message, stack: error.stack }, '创建链接帖失败');
        throw new AppError('创建链接帖失败', 500);
    }
}
export async function deleteLinkPost(id, userId) {
    let linkPost;
    try {
        linkPost = await prisma.linkPost.findUnique({
            where: { id: Number(id) },
            select: { userId: true }
        });
    } catch (error) {
        logger.error({ err: error.message, stack: error.stack }, '删除链接帖失败');
        throw new AppError('删除链接帖失败', 500);
    }
    if (!linkPost) {
        throw new AppError('链接帖子不存在', 404);
    }
    if (linkPost.userId !== userId) {
        throw new AppError('无权删除此链接帖子', 403);
    }
    await prisma.linkPost.delete({
        where: { id: Number(id) }
    });
    return { message: '链接帖子已删除' };
}