//文件，图片上传
import multer from 'multer';
import path from 'path';
import fs from "fs";
import AppError from './AppError.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbnails');
// 自动创建目录
[UPLOAD_DIR, THUMB_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 存储目标目录 dest: uploads/
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + ext;
    cb(null, fileName);
  }
});

// 文件过滤：仅 jpeg / png / webp
const fileFilter = (req, file, cb) => {
  const allowMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('仅支持 jpg / png / webp 图片', 400), false);
  }
};

// 限制20MB
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

export default upload;
