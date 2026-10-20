# L2Earn

学到的技能要能直接转化为价值：用 AI 规划学习路线、生成课程与练习，并把学习过程沉淀成可分享的知识。

前端是纯静态 SPA（React 19 + TypeScript + Vite 6，Tailwind CSS 本地构建），
没有自建后端；AI 能力采用 **BYOK（Bring Your Own Key）**——由使用者在浏览器里填写自己的
模型服务地址与密钥，直接连到 OpenAI / Anthropic 兼容端点。生产环境通过 GitHub Pages 发布。

- 仓库：`git@github.com:L3Earn/L3Earn.git`
- 线上地址：<https://l3earn.github.io/L3Earn/>（仓库名不同时替换路径，`base` 会自动跟随）
- 无服务器、无构建期密钥：产物里不含任何 API key

## 技术栈

| 层 | 选型 |
|---|---|
| 界面 | React 19、TypeScript 5.8 |
| 构建 | Vite 6（`@vitejs/plugin-react`） |
| 样式 | Tailwind CSS **v3**（PostCSS 本地编译，非 CDN） |
| 图表 / 图标 | Recharts、Lucide React |
| AI | 开放式 LLM 层：OpenAI Chat Completions + Anthropic Messages 两种协议，厂商可切换 |
| 后端（可选） | Supabase；未配置时使用内置 Mock 数据 |
| 测试 | Jest 30 + Testing Library |

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

- Node.js 22+，pnpm 版本见 `package.json` 的 `packageManager` 字段。
- 根目录的 `.env` **不会**被读取来注入 AI key（构建期不注入任何密钥），
  AI 配置在页面里填：左下角 **Settings → AI 引擎**（详见下文）。

## 构建与预览

```bash
pnpm build      # 产物在 dist/
pnpm preview    # 本地预览 dist/，默认 http://localhost:4173（子路径构建时为 /<base>/）
```

子路径构建可以本地验证：

```bash
BASE_PATH=/L3Earn/ pnpm build
BASE_PATH=/L3Earn/ pnpm preview      # → http://localhost:4173/L3Earn/
```

## 部署到 GitHub Pages

仓库自带 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：
推送到 `main`（或在 Actions 页面 `workflow_dispatch` 手动触发）后自动构建并发布。

一次性设置：仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

### base 路径与仓库名的关系

GitHub Pages 的站点位置决定资源前缀（`vite.config.ts` 的 `base`）：

| 场景 | 线上地址 | `base` |
|---|---|---|
| 项目站点（仓库名 `L3Earn`） | `https://l3earn.github.io/L3Earn/` | `/L3Earn/` |
| 用户/组织主页（仓库名 `<owner>.github.io`） | `https://<owner>.github.io/` | `/` |

推导优先级（见 `vite.config.ts`）：

1. 显式环境变量 `BASE_PATH`（CI 里传 `BASE_PATH=/${{ github.event.repository.name }}/`）；
2. GitHub Actions 中的 `GITHUB_REPOSITORY`（`owner/repo`）：仓库名以 `.github.io` 结尾 → `/`，否则 → `/<repo>/`；
3. 本地默认 `/`。

> 之后绑定自定义域名时，把 workflow 里的 `BASE_PATH` 改成 `/`（或删掉该环境变量并把仓库改名成
> `<owner>.github.io` 形态），否则资源会 404。

### 产物处理

workflow 在 `dist/` 里额外做两件事：

- `cp dist/index.html dist/404.html`：Pages 没有服务端路由，用 404 兜底 SPA；
- `touch dist/.nojekyll`：禁止 Jekyll 处理产物（避免以 `_` 开头的文件被忽略）。

## AI 引擎配置（BYOK）

打开 **Settings → AI 引擎**：

1. 选择厂商预设（OpenAI、Anthropic Claude、DeepSeek、Moonshot、MiniMax、OpenRouter、
   智谱 GLM、Ollama 本地、自定义/自托管）——预设只是填好默认地址与模型，不是白名单；
2. 填写 **API key**（Ollama 等本地服务可留空），需要时改 endpoint / model / 温度等参数；
3. 点「测试连接」确认可用后保存。

配置的存放位置：

- **API key**：默认只写 `sessionStorage`，关掉标签页即失效；勾选「记住此 key」才写 `localStorage`；
- **端点 / 模型 / 参数**：始终存 `localStorage`（不含密钥）；
- 构建期不注入、产物里不包含任何密钥（`vite.config.ts` 已移除所有 `define` 环境变量注入）。

支持的协议：

- **OpenAI 兼容**：`POST {baseUrl}/chat/completions`（OpenAI、DeepSeek、Moonshot、MiniMax、
  OpenRouter、智谱、Ollama、vLLM/LM Studio 等）；
- **Anthropic Messages**：`POST {baseUrl}/v1/messages`（浏览器直连会自动带
  `anthropic-dangerous-direct-browser-access` 头）。

### 部署方预置默认端点（可选）

如果一个实例想统一默认厂商/模型，把 `docs/config.example.js` 复制为 `public/config.js`，
改成自己的端点与模型（**不要写 API key**，产物是公开的），重新构建即可：
`index.html` 会在入口脚本之前加载 `/config.js`（构建时按 base 重写为 `/<repo>/config.js`）。
优先级：这里的默认值 < 用户在设置页保存的设置。默认的 `public/config.js` 是空配置。

## 安全姿态

本项目是纯前端 + BYOK，安全边界和三方脚本的取舍写在 `index.html` 的 CSP `<meta>` 里：

- `script-src 'self'`：只加载本站打包的脚本，**不引任何第三方脚本**
  （同源脚本能读到浏览器里的 key，所以不能用 CDN 脚本、统计脚本等）；
- `connect-src 'self' https:`：本项目是开放式多厂商结构，端点由用户在运行时填写，
  不能写死单个域名；因此允许任意 **https** 出站（不含 http，本地 Ollama 在 Pages 的
  https 页面下会被混合内容策略拦截）；
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`：Tailwind 产物是外链 CSS，
  组件里有内联样式，另外为了继续用 Google Fonts 字体；
- `img-src 'self' data: https:`、`font-src 'self' https://fonts.gstatic.com`：图片与字体来源；
- `default-src 'self'`、`base-uri 'self'`、`form-action 'self'`、`object-src 'none'`：其余一律收紧。

该 CSP 只在**生产构建**中生效：开发服务器会在 `vite.config.ts` 的 `devCspPlugin` 里移除它，
因为 React Fast Refresh / HMR 需要内联脚本与 `ws:` 连接。想看效果用 `pnpm preview`。

**风险提示**：key 在前端意味着同源 JavaScript（包括浏览器扩展、XSS）都能读到它。
请使用单独的低额度 key，不要在公共电脑上勾选「记住此 key」。本站没有服务器，
key 不会出现在 URL、页面源码或本站日志中，但也不对 key 的泄露承担任何责任。

## 目录结构

```
.
├── index.html                 # HTML 入口（CSP、字体、#root）
├── index.tsx                  # React 挂载入口（引入 index.css）
├── index.css                  # Tailwind 指令 + 基础样式/自定义工具类
├── App.tsx                    # 应用外壳与视图路由
├── components/                # UI 组件
├── services/
│   ├── llm/                   # 开放式 LLM 层（presets/providers/transport/types）
│   ├── llmService.ts          # 业务侧 AI 调用（路线、课程、辅导）
│   ├── llmConfig.ts           # BYOK 设置与密钥存取（session/localStorage）
│   ├── dbService.ts           # 数据访问（Supabase 或 Mock）
│   └── supabase.ts            # Supabase 客户端（未配置则走 Mock）
├── src/                       # Jest 测试与 setup
├── tailwind.config.js         # Tailwind v3 配置（自定义动画在此定义）
├── postcss.config.js
└── .github/workflows/deploy.yml
```

## 测试

```bash
pnpm test              # 全部 Jest 测试
pnpm test:watch        # watch 模式
pnpm test:coverage     # 覆盖率报告
pnpm test:ci           # CI 模式（单次 + 覆盖率）
pnpm verify            # 提交前：typecheck + typecheck:test + test:ci + build
```

## 文档

| 文档 | 内容 |
|---|---|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 开发手册：服务层 API 参考、改动指南、测试、调试与排障 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构脉络：分层与依赖方向、运行边界、扩展点 |
| [AGENTS.md](AGENTS.md) | 协作约定：命名、目录、风格 |
| [roadmap.md](roadmap.md) | 产品与技术路线（愿景，非现状） |
