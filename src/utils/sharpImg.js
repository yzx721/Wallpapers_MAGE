import sharp from "sharp";
import path from 'path'
import AppError from "../utils/AppError.js";
/**
 * 处理原图：获取元数据 + 生成缩略图
 * @param {string} originalFilePath 原图绝对路径
 * @param {string} fileName multer生成的文件名
 * @returns {Object} { width, height, thumbRelativePath }
 */
export async function handleImage(originalFilePath, fileName) {
     try {
    const root = process.cwd();
    const thumbFileName = `thumb_${fileName}`;
    const thumbAbsPath = path.join(root, 'uploads', 'thumbnails', thumbFileName);
    // 获取原图宽高
    const meta = await sharp(originalFilePath).metadata();

    // 生成480px宽缩略图，jpeg质量80
    await sharp(originalFilePath)
      .resize(480, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbAbsPath);
    return {
      width: meta.width,
      height: meta.height,
      thumbRelativePath: `/uploads/thumbnails/${thumbFileName}`
    };
  } catch {
    throw new AppError('图片压缩处理失败', 500);
  }
}
