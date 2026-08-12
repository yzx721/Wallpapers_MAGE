import {
    getLinkPosts as getLinkPostsApi,
    getLinkPostDetail as getLinkPostDetailApi,
    createLinkPost as createLinkPostApi,
    deleteLinkPost as deleteLinkPostApi
} from '../services/link-posts.js';
import { sendSuccessResponse } from '../utils/responseHelper.js';

export async function getLinkPosts(req, res) {
    const { page, limit, userId, tags, sort } = req.query;
    const result = await getLinkPostsApi({ page, limit, sort, tags, userId });
    return sendSuccessResponse(res, result, '获取成功');
}

export async function getLinkPostDetail(req, res) {
    const { id } = req.params;
    const detail = await getLinkPostDetailApi(Number(id),req.user?.id);
    return sendSuccessResponse(res, detail, '获取成功');
}

export async function createLinkPost(req, res) {
    const { title, description, linkType, tags, linkUrl, linkPassword, previewImageId } = req.body;
    const post = await createLinkPostApi({
        userId: req.user.id, title, description, linkType, tags, linkUrl, linkPassword, previewImageId
    });
    return sendSuccessResponse(res, post, '创建成功');
}

export async function deleteLinkPost(req, res) {
    const id = Number(req.params.id);
    await deleteLinkPostApi(id, req.user.id);
    return sendSuccessResponse(res, null, '删除成功');
}
