import { sendSuccessResponse } from '../utils/responseHelper.js';
import {searchImages as searchImageApi} from '../services/searchSearch.js';

export async function search(req, res) {
    const { keyword,type, offset = 0, limit = 10 } = req.query;
    const result = await searchImageApi({keyword, type, limit, offset});
    if(!result || !result.items || result.items.length === 0) {
        return sendSuccessResponse(res, { items: [], total: 0 }, '未找到相关结果');
    }
    return sendSuccessResponse(res, result, '搜索成功');
}