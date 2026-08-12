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
