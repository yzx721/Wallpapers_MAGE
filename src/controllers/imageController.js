import {
  getImageList as getImageListApi,
  getImageDetail as getImageDetailApi,
  deleteImage as deleteImageApi,
  uploadImage as uploadImageApi
} from '../services/imgService.js';
import AppError from '../utils/AppError.js';
import { sendNotFoundResponse, sendSuccessResponse } from '../utils/responseHelper.js';

export async function getImageList(req, res) {
  const { page, limit, sort, tags, userId, lastId } = req.query;
  const imageList = await getImageListApi({ page, limit, sort, tags, userId, lastId });
  return sendSuccessResponse(res, imageList, '获取成功');
}

export async function getImageDetail(req, res) {
  const { id } = req.params;
  const imageDetail = await getImageDetailApi(Number(id), req.user?.id);
  if (!imageDetail) {
    return sendNotFoundResponse(res, '图片不存在');
  }
  return sendSuccessResponse(res, imageDetail, '获取成功');
}

export async function deleteImage(req, res) {
  const imageId = Number(req.params.id);
  const userId = req.user.id;
  await deleteImageApi(imageId, userId);
  return sendSuccessResponse(res, null, '删除成功');
}
export async function uploadImage(req, res) {
  if(!req.file) {
    throw new AppError('请上传图片文件', 400);
  }
  const resultdata = await uploadImageApi({
    file: req.file,
    userId: req.user.id,
    ...req.body
  });
  return sendSuccessResponse(res, resultdata, '上传成功');
  };

