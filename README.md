# Orbit · 个人作品集网站

一个可以直接部署到 Cloudflare 的个人展示网站，包含完整的内容管理后台。深色星空主题，前台与后台共用一套设计语言。

> 默认内容是示例人物「林川」。部署完成后，在后台把所有文案改成你自己的即可。

## 功能

**前台**
- 深色星空视觉：Canvas 星点、流星、视差与渐变星云，支持 `prefers-reduced-motion`
- 个人首页：Hero、关于我、技能、精选项目、最新文章、联系表单
- 项目档案与项目详情页
- 博客：全文搜索、标签筛选、阅读时长、Markdown 渲染、上一页/下一页、复制链接与阅读进度
- 联系表单：蜜罐字段、IP 频率限制、留言写入数据库
- 响应式布局、键盘焦点、语义化结构、SEO 基础 meta

**后台**
- 首次访问初始化管理员账号
- 数据概览、最近留言、最近编辑
- 个人资料编辑（头像、简介、社交链接、工作年限等）
- 技能分组增删改
- 项目增删改、草稿/发布、精选、封面、技术栈、Markdown 详情
- 博客增删改、草稿/发布、发布时间、标签、封面、Markdown 实时预览
- 留言收件箱：筛选、搜索、标记已读/未读、邮件回复、删除
- 站点标题、描述、页脚与全局强调色
- 管理员用户名与密码修改，其他设备会话自动失效
- 所有内容修改直接写入 Cloudflare D1，立即在线上生效，无需重新部署

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19、Vite、React Router、TypeScript |
| 样式 | 原生 CSS（自建设计系统，无 UI 框架） |
| 内容渲染 | react-markdown + remark-gfm |
| API | Hono on Cloudflare Workers |
| 数据库 | Cloudflare D1（SQLite） |
| 认证 | PBKDF2-SHA256 加盐密码哈希 + D1 会话 + HttpOnly Cookie |
| 部署 | Cloudflare Workers Static Assets + D1 |

前端与 API 在同一域名下运行：`/api/*` 由 Worker 处理，其余请求由 Workers Static Assets 返回单页应用。

## 本地开发

环境要求：**Node.js ≥ 22**、**pnpm**（推荐；也可以使用 npm + npx）。

```bash
pnpm install

# 初始化本地 D1 数据库并写入示例内容
pnpm db:migrate

# 同时启动 Vite 前端（5173）和本地 Workers API（8787）
pnpm dev
```

打开 <http://127.0.0.1:5173>。

- 前台开发地址：`http://127.0.0.1:5173`
- 首次进入后台：`http://127.0.0.1:5173/admin/setup`
- 本地 D1 数据位于 `.wrangler/state/`，不会上传到 Cloudflare

如果只想单独运行一边：

```bash
pnpm dev:web   # Vite，需要另开一个终端跑 pnpm dev:api
pnpm dev:api   # wrangler dev
```

> `predev` 会先执行一次生产构建，确保 Wrangler 的静态资源目录存在。Vite 开发时仍然拥有 HMR。

### 常用检查

```bash
pnpm check          # 前端 + Worker TypeScript 类型检查
pnpm build          # 类型检查并生成 dist/client
pnpm wrangler --version
```

## 部署到 Cloudflare

以下命令在项目根目录执行。需要已经安装依赖并登录 Cloudflare。

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 创建 D1 数据库

```bash
npx wrangler d1 create portfolio-db
```

命令会输出一个 `database_id`（UUID）。打开 `wrangler.jsonc`，把占位值：

```jsonc
"database_id": "00000000-0000-0000-0000-000000000000"
```

替换成真实 UUID。**这一步不做，部署会失败。**

如果 `portfolio-db` 这个名字已被占用，可以换成其他名字，同时修改 `wrangler.jsonc` 里的 `database_name` 和上方命令。

### 3. 初始化远程数据库

```bash
npx wrangler d1 migrations apply portfolio-db --remote
```

这会创建全部数据表并写入示例内容。

### 4. 构建并部署

```bash
pnpm deploy
```

`deploy` 脚本会先执行构建，再上传 Worker 和 `dist/client` 静态资源。部署成功后，Wrangler 会输出一个 `*.workers.dev` 地址。

如果已经手动执行过 `pnpm build`，也可以直接运行 `npx wrangler deploy`。只运行 `npx wrangler deploy` 不会自动构建前端。

### 5. 立即创建管理员

打开：

```
https://你的域名/admin/setup
```

创建一个至少 12 位的管理员密码。

> ⚠️ **请部署完成后立刻完成这一步。** 在第一个管理员创建之前，初始化接口是开放的。创建完成后它会自动锁定，后续访问只会跳转到登录页。

也建议在 Cloudflare Zero Trust 中为 `/admin*` 和 `/api/admin*` 增加一层 Cloudflare Access。它是可选加固，不是网站运行的必要条件。

### 自定义域名

在 Cloudflare Dashboard → Workers & Pages → 选择此 Worker → Settings → Domains & Routes 中添加自定义域名即可。D1 数据不会受影响。

### 更新与重新部署

内容修改不需要重新部署。只有改了代码后才需要：

```bash
pnpm deploy
# 或者
npx wrangler deploy
```

如果未来有新的数据库迁移文件：

```bash
npx wrangler d1 migrations apply portfolio-db --remote
npx wrangler deploy
```

### Windows 一键部署

项目根目录包含 `deploy.cmd`。双击它，或在本目录的终端执行：

```powershell
.\deploy.cmd
```

脚本会自动构建、检查并部署。需要重新登录 Cloudflare 时执行 `npx.cmd wrangler login`。

## 后台使用

| 模块 | 说明 |
| --- | --- |
| 个人资料 | 姓名、头像、身份、首页文案、关于我、联系邮箱、社交链接 |
| 技能管理 | 按分类管理技能、熟练度和排序 |
| 项目管理 | 项目封面、摘要、Markdown 详情、技术栈、外链、草稿/发布 |
| 博客文章 | Markdown 编辑与预览、标签、摘要、封面、发布时间、发布/草稿 |
| 留言收件箱 | 未读筛选、搜索、已读状态、邮件回复、删除 |
| 站点设置 | 浏览器标题、SEO 描述、页脚文字、主题强调色 |
| 账号与安全 | 修改用户名与密码 |

**图片怎么处理？**
这是一个轻量、无 R2 依赖的版本。封面和头像使用图片 URL：
- 把图片放到 `public/images/`，后台填 `/images/your-file.jpg`
- 或直接填写任意 HTTPS 图床/对象存储链接
- 站点的 CSP 允许 `https:` 图片

**文章格式**
博客与项目详情支持 GitHub Flavored Markdown：标题、列表、粗体、引用、表格、代码块等。

## 数据备份与恢复

导出远程 D1：

```bash
npx wrangler d1 export portfolio-db --remote --output backup.sql
```

本地导出：

```bash
npx wrangler d1 export portfolio-db --local --output backup-local.sql
```

**忘记管理员密码**

密码无法通过邮件找回。确认没有其他管理员后，可以清空管理员表，再重新访问 `/admin/setup`。数据库中的项目、文章和个人资料不会被删除：

```bash
npx wrangler d1 execute portfolio-db --remote --command "DELETE FROM sessions"
npx wrangler d1 execute portfolio-db --remote --command "DELETE FROM admins"
```

> 如果使用自定义数据库名，请把命令中的 `portfolio-db` 换成对应名称。

## 安全说明

- 密码以 PBKDF2-SHA256 + 随机盐哈希存储，不保存明文。
- 登录会话保存在 D1，浏览器只持有随机会话令牌（HttpOnly、SameSite=Lax，生产环境启用 Secure）。
- 登录接口有 IP 频率限制，并在连续失败后临时锁定账号。
- 后台写接口拒绝非 JSON 请求，并校验同源 Origin。
- 联系表单包含蜜罐字段和基于 IP 哈希的频率限制。
- 静态资源通过 `public/_headers` 应用 CSP、HSTS、`X-Frame-Options` 等安全响应头。

个人项目为了兼容 Workers Free 的 CPU 限制，密码哈希迭代次数相对保守。请务必使用**长且唯一的密码**（建议 16 位以上，或使用密码管理器生成），并为后台增加 Cloudflare Access。

## 项目结构

```text
.
├─ migrations/              D1 表结构与示例内容
│  ├─ 0001_schema.sql
│  └─ 0002_seed.sql
├─ public/                  静态资源（图片、favicon、_headers）
├─ shared/types.ts          前后端共享类型
├─ src/
│  ├─ components/           前台共用组件（星空、导航、表单、Markdown 等）
│  ├─ pages/                首页、项目、博客页面
│  ├─ admin/                后台页面与后台专用样式组件
│  ├─ lib/                  API 客户端、格式化工具、站点上下文
│  └─ styles/               base / public / admin 三套样式
├─ worker/
│  ├─ index.ts              Worker 入口与安全中间件
│  ├─ routes/
│  │  ├─ public.ts          公开内容、博客、项目、联系表单
│  │  ├─ auth.ts            初始化、登录、登出、会话
│  │  └─ admin.ts           后台 CRUD、留言、设置、账号
│  └─ lib/                  数据库映射、校验、认证与工具
├─ index.html
├─ vite.config.ts
└─ wrangler.jsonc
```

## 可自定义的地方

- **所有展示内容**：通过后台修改，无需改代码。
- **主题强调色**：站点设置中修改。
- **静态图片与 favicon**：`public/images/`、`public/favicon.svg`。
- **初始示例内容**：修改 `migrations/0002_seed.sql`。已经执行过迁移的数据库不会自动重跑 seed。
- **页面固定文案**：首页章节标题、按钮文案等在 `src/pages/` 与 `src/components/` 中。
- **SEO 初始信息**：`index.html` 中的默认 meta；运行时标题和描述会读取后台设置。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 先构建，再同时启动 Vite 和 Wrangler |
| `pnpm dev:web` / `pnpm dev:api` | 单独启动前端 / API |
| `pnpm build` | 类型检查并构建前端 |
| `pnpm check` | 前后端类型检查 |
| `pnpm db:migrate` | 应用本地 D1 迁移 |
| `pnpm db:migrate:remote` | 应用远程 D1 迁移 |
| `pnpm deploy` | 构建并部署到 Cloudflare |

## 说明

- 默认示例内容（林川、项目、文章、邮箱）仅用于展示，请替换。
- 联系表单不发送邮件通知；所有留言保存在后台收件箱。
- 未包含图片上传功能，使用图片 URL 是刻意的轻量化取舍，可避免额外依赖 R2。
- `project` 与 `post` 的 slug 默认使用英文小写与连字符；中文标题会自动生成随机 slug，也可以手动指定。

如果站点需要接入评论、图片上传或邮件通知，可以在此结构上继续扩展。
