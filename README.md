# Wallpapers MAGE · 后端 API

壁纸分享社区的后端服务：Express 5 + Prisma 7 + MySQL 8，提供图片 / 套图 / 链接帖的增删查、统一的多态点赞与评论、全文搜索、标签聚合、用户认证。

前端仓库：`wallpapers-mage-web`（Vue 3）。

## 快速开始

```bash
npm install
cp .env.example .env        # 填数据库连接 + JWT 密钥
npx prisma db push          # 建表（有迁移文件时用 npx prisma migrate deploy）
npm run dev                 # tsx 启动，http://localhost:3000
```

> 代码是 TypeScript，**必须用 tsx 运行**（`node server.js` 会报模块找不到）。生产用 `pm2 start server.js --interpreter tsx`。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Express 5 |
| ORM | Prisma 7（MariaDB adapter）· MySQL 8 |
| 认证 | JWT 双 token（jose）：access 15min + refresh 7d |
| 中间件 | 鉴权 / 可选鉴权 / 限流（express-rate-limit 60次/分） |
| 文件 | multer（上传）· sharp（图片压缩/缩略图） |
| 日志 | pino + pino-http |

## 目录结构

```
src/
├── controllers/   # 控制器（参数解析 → 调 service → 响应）
├── services/      # 业务逻辑（Prisma 查询）
├── routes/        # 路由定义
├── middleware/    # authMiddleware / optionalAuthMiddleware / refreshAuthMiddleware
├── utils/         # prisma、jwtHelper、rateLimiter、AppError、responseHelper、logger
├── srcipts/       # seed-unsplash.mjs（Unsplash 图片导入）
└── generated/     # Prisma 生成代码（不入库）
```

## API 一览

统一响应格式：`{ message, data }`；错误：`{ error: string }`。带 `🔒` 的需登录（`Authorization: Bearer <accessToken>`）。

### 用户
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/v1/user/register` | 注册（用户名/邮箱/密码） |
| POST | `/v1/user/login` | 登录，返回 access+refresh token |
| POST | `/v1/user/token/refresh` | 🔒 刷新 access token |
| GET | `/v1/user/:id` | 用户详情（含作品计数 `_count`） |
| GET | `/v1/user/:id/work` | 用户作品流（图片+套图 UNION 分页） |

### 图片
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/v1/images?page&limit&sort&tags&userId` | 列表（支持按标签/作者过滤、热门排序） |
| POST | `/v1/images` | 🔒 上传（multipart: file/title/description/tags），sharp 压缩+缩略图 |
| GET | `/v1/images/:id` | 详情（optionalAuth：登录后返回 `liked` 是否已点赞） |
| DELETE | `/v1/images/:id` | 🔒 删除（校验作者） |

### 套图 / 链接帖
| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST | `/v1/albums` | 🔒 列表 / 创建（title/description/tags/coverImageId/imageList） |
| GET/DELETE | `/v1/albums/:id` | 详情（含图片列表）/ 🔒 删除 |
| GET/POST | `/v1/link-posts` | 🔒 列表 / 创建（title/linkUrl/linkType/linkPassword/previewImageId） |
| GET/DELETE | `/v1/link-posts/:id` | 详情（含 likeCount、liked）/ 🔒 删除 |

### 点赞 / 评论（多态）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/v1/:targetType/:targetId/like` | 🔒 点赞/取消（toggle），targetType: images/albums/link-posts |
| GET | `/v1/:targetType/:targetId/comments` | 评论列表（分页、parentId 楼中楼） |
| POST | `/v1/:targetType/:targetId/comments` | 🔒 发评论/回复 |

### 搜索 / 标签
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/v1/search?keyword&type&page&limit` | 全文搜索（MySQL FULLTEXT + ngram） |
| GET | `/v1/tags?type&sort` | 标签聚合（JSON 字段统计，按 count/name 排序） |

## 设计要点

- **多态互动**：点赞/评论统一存一张表（`targetType`+`targetId`），一个 toggle 接口覆盖图片、套图、链接帖，新增内容类型零改动。
- **可选鉴权**：`optionalAuthMiddleware` 让公开详情接口在带 token 时返回「当前用户是否已点赞」，匿名访问不报错。
- **中文搜索**：MySQL FULLTEXT 全文索引用 `ngram` 分词器，解决中文整串分词问题。
- **外部图源**：`source='api'` + `apiSourceUrl` 字段支持从外部 API 导入（seed-unsplash.mjs 只存 URL 不落二进制）。
- **裸 SQL 列名约定**：`$queryRaw` 返回数据库真实下划线列名，与 `findMany` 的 camelCase 不同，前端需映射。

## 脚本

```bash
npx tsx src/srcipts/seed-unsplash.mjs [批次数]   # 导入 Unsplash 壁纸，随机主题+翻页，可反复跑，按 apiSourceUrl 去重
```

## 部署

见前端仓库 [DEPLOY.md](../wallpapers-mage-web/DEPLOY.md)：Nginx + PM2 + MySQL 单机部署。
