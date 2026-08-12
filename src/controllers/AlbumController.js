import {
    getAlbumList as getAlbumListApi,
    getAlbumDetail as getAlbumDetailApi,
    deleteAlbum as deleteAlbumApi,
    createAlbum as createAlbumApi
} from '../services/AlbumService.js';
import AppError from '../utils/AppError.js';
import { sendNotFoundResponse, sendSuccessResponse } from '../utils/responseHelper.js';
export async function getAlbumList(req, res) {
    const { page, limit, userId, tags, sort } = req.query;
    const albumList = await getAlbumListApi({ page, limit, sort, tags, userId });
    return sendSuccessResponse(res, albumList, '获取成功');
}
export async function getAlbumDetail(req, res) {
    const { id } = req.params;
    const albumDetail = await getAlbumDetailApi(Number(id));
    return sendSuccessResponse(res, albumDetail, '获取成功');
}
export async function deleteAlbum(req, res) {
    const id = Number(req.params.id);
    const userId = req.user.id;
    await deleteAlbumApi(id, userId);
    return sendSuccessResponse(res, null, '删除成功');
}
export async function createAlbum(req, res) {
    const { title, description, tags, coverImageId, imageList } = req.body;
    const album = await createAlbumApi({ userId: req.user.id, title, description, tags, coverImageId, imageList });
    return sendSuccessResponse(res, album, '创建成功');
}
