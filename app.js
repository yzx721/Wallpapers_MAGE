import express from "express";
import cors from "cors";
import crypto from "crypto";
import limiter from "./src/utils/rateLimiter.js";
import { pinoHttpMiddleware } from "./src/utils/loggerHelper.js";
import globalErrorHandler from "./src/utils/globalErrorhandle.js";

const app = express();

// ---------- 基础中间件 ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- 请求追踪 ID ----------
app.use((req, res, next) => {
  req.traceId = crypto.randomUUID().slice(0, 8);
  res.setHeader("X-Trace-Id", req.traceId);
  next();
});

// ---------- 日志中间件 ----------
app.use(pinoHttpMiddleware);

// ---------- 限流（在日志之后，限流也会被记录）----------
app.use(limiter);

// ---------- 静态文件 ----------
app.use("/uploads", express.static("uploads"));

// ---------- 路由 ----------
import userRoutes from "./src/routes/user.js";
import imageRoutes from "./src/routes/image.js";
import albumRoutes from "./src/routes/album.js";
import linkPostRoutes from "./src/routes/link-post.js";
import likesCommentsRoutes from "./src/routes/likes-comments.js";
import searchRoutes from "./src/routes/search.js";
import tagRoutes from "./src/routes/tags.js";
app.use("/v1/search", searchRoutes);
app.use("/v1/tags", tagRoutes);
app.use("/v1/user", userRoutes);
app.use("/v1/images", imageRoutes);
app.use("/v1/albums", albumRoutes);
app.use("/v1/link-posts", linkPostRoutes);
app.use("/v1", likesCommentsRoutes);

// ---------- 前端静态托管（演示/生产：后端直接服务构建产物） ----------
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 默认取 C:\Vue-project 下同级的 wallpapers-mage-web/dist，可用环境变量 FRONTEND_DIST 覆盖
// __dirname = Wallpapers_MAGE 根目录（app.js 在根），向上一层到 C:\Vue-project
const distDir = process.env.FRONTEND_DIST || path.resolve(__dirname, "..", "wallpapers-mage-web", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA 回退：GET 且非 API/上传的请求都返回 index.html（前端路由交给 Vue Router）
  // 注意：Express 5 不支持 app.get("*")，用中间件形式
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/v1") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// ---------- 健康检查 ----------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Wallpapers MAGE API" });
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

// ---------- 全局错误处理 ----------
app.use(globalErrorHandler);

export default app;
