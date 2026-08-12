import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";
export async function getAlbumList(params) {
    const {
      page = 1,
      limit = 10,
      userId,
      tags,
      sort = 'createdAt_desc'
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

    const albumList = await prisma.album.findMany({
        where,
        skip: (Number(page) - 1) * safeLimit,
        take: safeLimit,
        orderBy,
        include: {
            coverImage: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                }
            },
            _count: {
                select: { images: true }
            }
        }
    });

    const total = await prisma.album.count({ where });
    const pagination = {
        page: Number(page),
        limit: safeLimit,
        total,
        totalPage: Math.ceil(total / safeLimit)
    };
    return { albumList, pagination };
}
export async function getAlbumDetail(id) {
   try{
    const albumDetail = await prisma.album.findUnique({
        where:{id:Number(id)},
        include:{
            coverImage:true,
            user:{
                select:{
                    id:true,
                    username:true,
                    avatarUrl: true
                }
            },
            images: {
            include: { image: true },
            orderBy: { sortOrder: "asc" }
            },
             _count: { select: { images: true } }

        }

    })
    if(!albumDetail){
        throw new AppError('套图不存在', 404);
    }
    //浏览量+1
    await prisma.album.update({
        where: { id: Number(id) },
        data: { viewCount: { increment: 1 } }
    })
    return albumDetail;
   }catch(error){
     logger.error({ err: error.message, stack: error.stack, albumId: id }, '获取套图详情失败');
    throw new AppError('获取套图详情失败', 404);
   }
}
export async function deleteAlbum(id, userId) {
    let album;
    try {
        album = await prisma.album.findUnique({
            where:{id:Number(id),},
            select:{
                    userId:true
            }
         });
    }catch (error) {
        logger.error({ err: error.message, stack: error.stack, albumId: id, userId }, '删除套图失败');
        throw new AppError('删除套图失败', 500);
    }
    if(!album){
        throw new AppError('套图不存在', 404);
    }
    if(album.userId !== userId){
        throw new AppError('无权限删除该套图', 403);
    }
    await prisma.album.delete({
        where:{id:Number(id)}
    })
    return { message: '该套图已删除' };
}
export async function createAlbum(data) {
    const {userId,  title,  description,
        tags,coverImageId,imageList = []
    } = data;
    try{
        const album = await prisma.album.create({
            data:{
                userId,
                title,
                description,
                coverImageId,
                tags: tags || null,
                viewCount: 0,
                images: {
                    create: imageList.map((image, index) => ({
                        imageId: image.id,
                        sortOrder: index
                    }))
                }
            },
            include:{
                coverImage:true,
                user:{select:{id:true,username:true,avatarUrl:true}},
                images:{include:{image:true},orderBy:{sortOrder:"asc"}},
                _count:{select:{images:true}}
            }
        })
        return album;
        }
        catch (error) {
        logger.error({ err: error.message, stack: error.stack, userId, title }, '创建套图失败');
        throw new AppError('创建套图失败', 500);
    }

}
