import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";
/**
 * 壁纸全文搜索
 * @param {string} keyword 搜索关键词
 * @param {number} offset 分页偏移
 * @param {number} limit 每页条数
 */
export async function searchImages({ keyword,type, offset, limit }) {
    const searchMap={
        image: 'images',
        album: 'albums',
        linkPost: 'link_posts'
    }
    const tableName = searchMap[type];
    if(!tableName){
        throw new AppError('无效的搜索类型', 400);
    }
    // req.query 取到的都是字符串，LIMIT/OFFSET 传字符串会让 MySQL 报语法错误，这里统一转数字
    const safeLimit = Number(limit) || 10;
    const safeOffset = Number(offset) || 0;
     // 关键词为空直接返回空数据，避免无效SQL查询
    if (!keyword?.trim()) {
        return {
            type,
            items: [],
            total: 0
        };
    }
    const sql = `
    SELECT *, MATCH(title, description) AGAINST(? IN BOOLEAN MODE) AS score
    FROM ${tableName}
    WHERE MATCH(title, description) AGAINST(? IN BOOLEAN MODE)
    ORDER BY score DESC
    LIMIT ? OFFSET ?
    `
    const items = await prisma.$queryRawUnsafe(sql, keyword, keyword, safeLimit, safeOffset);
    const countSql = `
    SELECT COUNT(*) AS cnt 
    FROM ${tableName} 
    WHERE MATCH(title, description) AGAINST(? IN BOOLEAN MODE)
    `;
    const totalRes = await prisma.$queryRawUnsafe(countSql, keyword)
    return {
        type,
        items,
        total: Number(totalRes[0].cnt)
    }

}