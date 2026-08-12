import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";
// 类型映射表
const targetMap = {
images: "image",
albums: "album",
"link-posts": "link_post",
};
const orderMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
};
export async function toggleLike(params) {
    const { userId, targetType, targetId } = params;
    const TargetType = targetMap[targetType];
    let message;
    if (!TargetType) {
        throw new AppError("无效的点赞类型", 400);
    }
    const existingLike = await prisma.like.findUnique({
        where: {
            //联合键
            userId_targetType_targetId: {
                userId,
                targetType: TargetType,
                targetId: Number(targetId)
            }
        }
    });

    if(existingLike){
        //已点赞，取消点赞
        await prisma.like.delete({
            where: {
                id: existingLike.id
            }
        });
        message = "已取消点赞";
    }
    else{
    // 未点赞，添加点赞
    await prisma.like.create({
        data: {
            userId,
            targetType: TargetType,
            targetId: Number(targetId)
        }
    });
    message = "已点赞";
    }

    // 查询当前内容总点赞数
    const likeCount = await prisma.like.count({
        where: {
        targetType: TargetType,
        targetId: Number(targetId)
        }
    });
    return { message, likeCount };
}
export async function postComment(params) {
    const { userId, targetType, targetId, content,parentId } = params;
    if(!targetMap[targetType]){
        throw new AppError("无效的评论类型", 400);
    }
    if(parentId){
        // 检查父评论是否存在
        const parentComment = await prisma.comment.findUnique({
            where: { id: Number(parentId) },
        });
        if(!parentComment){
            throw new AppError("回复的评论不存在", 404);
        }
    }
    const newComment = await prisma.comment.create({
        data:{
            userId,
            targetType: targetMap[targetType],
            targetId: Number(targetId),
            content,
            parentId: parentId ? Number(parentId) : null
        },
        include: { user: 
        { 
            select: { id: true, username: true, avatarUrl: true } 
        } },
    })
    return newComment;
}
export async function getCommentsList(params) {
    const {type, targetId, parentId, order,limit=5,skip=0} = params;
    if(!targetMap[type]){
        throw new AppError("无效的评论类型", 400);
    }
    const where = {
        parentId: parentId ? Number(parentId) : null,
        targetId: Number(targetId),
        targetType: targetMap[type],
    };
    const commentList = await prisma.comment.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
            user: {
                select: { id: true, username: true, avatarUrl: true }
            }
        },
        orderBy: orderMap[order] || { createdAt: "desc" },
    });
    const total = await prisma.comment.count({ where });
    return { comments: commentList, total };
}