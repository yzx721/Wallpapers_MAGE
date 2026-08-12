# Wallpapers MAGE

## Tech Stack
- **Runtime:** Node.js (tsx for dev)
- **Framework:** Express 5
- **Database:** MySQL 8 + Prisma 7 (with @prisma/adapter-mariadb)
- **Auth:** JWT (jose)
- **File upload:** multer + sharp
- **Logging:** pino + pino-http
- **Package manager:** pnpm

## Project Structure
```
app.js                  — Express 入口，注册中间件 + 路由
server.js               — 启动入口，引入 dotenv
prisma/schema.prisma    — 数据库 schema
src/
  routes/               — 路由定义（每个模块一个文件）
  controllers/          — 参数提取，调 service
  services/             — 业务逻辑 + Prisma 查询
  middleware/           — auth 中间件
  utils/                — 工具函数
```

## Code Conventions

### Route 命名
- `/v1/auth`, `/v1/images`, `/v1/albums`, `/v1/link-posts`
- `/v1/search`, `/v1/tags`
- 点赞/评论挂载在 `/v1` 下，路由用动态参数: `/:targetType/:targetId/like`

### Controller → Service 传参
- **Controller 必须传对象**，Service 解构对象。禁止传独立参数。
  - ✅ `service({ userId, title, tags })`
  - ❌ `service(userId, title, tags)`

### Controller 获取 userId
- 必须从 `req.user.id`（auth 中间件注入），不从 `req.body` 取。
  - ✅ `userId: req.user.id`
  - ❌ `const { userId } = req.body`

### Error Handling
- 业务错误用 `throw new AppError('消息', 状态码)`
- Service 层 catch 块中：`if (error instanceof AppError) throw error`，再抛通用 500
- Controller 不再 catch，由 `globalErrorHandler` 统一处理

### Service 模式
- 存在性检查在 viewCount +1 之前
  - ✅ 先 `findUnique`，不存在则 throw 404，再 `update viewCount`
  - ❌ 先 `update viewCount`，再 `findUnique`

### Prisma 查询
- tags 是 JSON 字段，用 `array_contains` 操作符筛选
- 涉及 MySQL JSON 函数（如标签聚合）时使用 `$queryRawUnsafe`

### 代码风格
- 错误日志统一用 `logger.error({ err, stack })` 格式
- 响应统一用 `sendSuccessResponse(res, data, message)` / `sendNotFoundResponse(res, message)`
- 接口消息用中文

## 约束
- 只做用户明确要求的模块和任务，不要自作主张做额外的事
- 测试中遇到跟当前模块无关的问题，停下来告诉用户，不越界修改配置或代码
- 不确定该不该做的事，先问用户

## 当前后端完成状态
- ✅ 认证（注册/登录/refresh token）
- ✅ 图片 CRUD + 上传
- ✅ 套图 CRUD
- ✅ 链接帖 CRUD
- ✅ 点赞/评论
- ✅ 搜索
- ✅ 标签
- ✅ 用户主页
- ⬜ API 导入脚本（pending）
