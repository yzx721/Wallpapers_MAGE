import { sendSuccessResponse } from '../utils/responseHelper.js';
import {
    toggleLike as toggleLikeApi,
    postComment as postCommentApi,
    getCommentsList as getCommentsListApi
} from '../services/like_commentsService.js';

export async function toggleLikeController(req, res) {
    const { targetType, targetId } = req.params;
    const result = await toggleLikeApi({ userId: req.user.id, targetType, targetId });
    return sendSuccessResponse(res, result, '操作成功');
}
export async function postCommentController(req, res) {
    const { targetType, targetId } = req.params;
    const { content, parentId } = req.body;
    const comment = await postCommentApi({ userId: req.user.id, targetType, targetId, content, parentId });
    return sendSuccessResponse(res, comment, '评论成功');
}
export async function getCommentsListController(req, res) {
    const { targetType, targetId } = req.params;
    const { parentId, order } = req.query;
    const commentsList = await getCommentsListApi({ type: targetType, targetId, parentId, order });
    return sendSuccessResponse(res, commentsList, '获取成功');
}
