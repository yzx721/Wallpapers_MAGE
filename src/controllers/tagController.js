import { getTags as getTagsApi } from '../services/tagService.js';
import { sendSuccessResponse } from '../utils/responseHelper.js';

export async function getTags(req, res) {
    const { type, sort } = req.query;
    const tags = await getTagsApi({ type, sort });
    return sendSuccessResponse(res, tags, '获取成功');
}
