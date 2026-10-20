# L2Earn 架构脉络

> 这份文档描述**骨架**：谁依赖谁、请求怎么流动、在哪里扩展。具体实现细节请直接读代码。

## 1. 一句话定位

L2Earn = **纯静态 SPA**（GitHub Pages）+ **浏览器 BYOK 的开放式 AI 层**（任意 OpenAI / Anthropic 兼容端点）。
没有服务端、没有构建期密钥、没有第三方脚本。

## 2. 分层与依赖方向

依赖必须**单向**流动，下层不得反向 import 上层：

```
┌─────────────────────────────────────────────────────────────┐
│ 入口层     index.html → index.tsx → App.tsx                  │
│            (CSP / 字体 / Tailwind 产物 / React 挂载)           │
├─────────────────────────────────────────────────────────────┤
│ 视图层     components/*.tsx                                  │
│            受控组件：只通过 props 拿状态、回调触发业务          │
├─────────────────────────────────────────────────────────────┤
│ 应用编排   App.tsx                                           │
│            ViewState 状态机 + 三份「提升状态」+ 全部 handler    │
│            (dashboardState / treeState / studioState)         │
├─────────────────────────────────────────────────────────────┤
│ 领域服务   services/llmService.ts   ← AI 能力（prompt/校验/降级）│
│            services/dbService.ts    ← 数据持久化（可选 Supabase）│
├─────────────────────────────────────────────────────────────┤
│ 基础能力   services/llmConfig.ts    ← BYOK 设置与密钥存储        │
│            services/llm/            ← 协议无关的 LLM 客户端      │
│              ├─ transport.ts       超时/重试/错误归一化          │
│              ├─ providers/openai     Chat Completions 适配       │
│              ├─ providers/anthropic  Messages 适配               │
│              ├─ presets.ts          厂商预设（只是填默认值）      │
│              └─ json.ts             JSON 抽取 + SVG 清洗         │
└─────────────────────────────────────────────────────────────┘
```

**边界规则（重要）**

| 规则 | 原因 |
|---|---|
| `components/` 不直接 `import services/llm/providers/*` | 协议细节只能经 `llmService.ts` 暴露给 UI |
| `components/` 只调 `llmService.ts` / `dbService.ts` 的导出函数 | 保持可替换、可单测 |
| `services/llm/*` 不认识业务类型（CoursePlan 等） | 它只收发文本，业务结构在 `llmService.ts` 校验 |
| 不允许构建期注入任何密钥 | 产物公开，`vite.config.ts` 的 `define` 已移除 LLM 变量 |
| 不允许引入第三方 `<script>` | CSP `script-src 'self'`，且同源脚本能读到 key |

## 3. 三条运行边界

| 边界 | 发生在哪 | 有什么 |
|---|---|---|
| **构建期** | `vite build` | 只决定 `base`（部署子路径）与打哪些 chunk；**不含任何密钥** |
| **运行时（浏览器）** | 用户打开页面 | 端点/模型来自设置（localStorage），密钥来自 sessionStorage 或 localStorage（用户勾选记住） |
| **部署期** | GitHub Actions | `pnpm install → pnpm build → dist/ → Pages`；`base` 由 `BASE_PATH` / `GITHUB_REPOSITORY` 推导 |

## 4. AI 链路（核心）

```
用户在「设置 → AI 引擎」填写
   presetId / protocol / baseUrl / model / key
        │
        ▼
services/llmConfig.ts
   saveLlmSettings() + saveApiKey()
   └─ 端点、模型 → localStorage
      key → sessionStorage（默认）或 localStorage（勾选记住）
        │
        ▼ 每次调用都重新读取（改完设置立即生效）
services/llmService.ts
   generateCareerPath / generateCourseOutline / generateModuleContent
   generateLearningTree / sendMessageToTutor / polishInsight
   └─ 职责：写 prompt、解析 JSON、校验结构、失败降级、SVG 清洗
        │
        ▼
services/llm/index.ts  createLlmClient(connection)
        │
        ├─ providers/openai.ts     POST {baseUrl}/chat/completions
        │                          Authorization: Bearer <key>
        └─ providers/anthropic.ts  POST {baseUrl}/v1/messages
                                   x-api-key + anthropic-version
                                   + anthropic-dangerous-direct-browser-access
        │
        ▼
services/llm/transport.ts   fetch + 超时 + 重试 + LlmError 归一化
        │
        ▼
用户填写的第三方端点（浏览器直连，无代理）
```

**失败语义**（UI 依赖这个契约）：

- 文本类（导师对话 / 职业路径 / Insight）→ 返回可展示的降级文案，不抛异常
- 结构化类（大纲 / 模块内容 / 学习树）→ 返回 `null`，由调用方决定提示
- 未配置 key → `LlmError.code === 'no_api_key'`，对话直接提示「去设置里填 key」

## 5. 数据链路（可选后端）

```
入口层 index.tsx
   configureSupabase(import.meta.env.VITE_SUPABASE_URL,
                     import.meta.env.VITE_SUPABASE_ANON_KEY)
        │  只在这里读一次环境变量；未配置 → client = null
        ▼
services/supabase.ts   getSupabaseClient() / isSupabaseConfigured()
        ▲
        │
services/dbService.ts
   getCourses()
      ├─ 已配置 ? client.from('courses') : MOCK_COURSES
      └─ 未配置时延迟 500ms 返回内置 Mock（演示模式仍可跑）
   saveLearningPath(userId, path)
      └─ 已配置则写库；否则 console.log 模拟保存
```

**为什么环境变量只在入口读**：`import.meta.env` 是 ESM 语法，Jest（CJS）无法解析；
把它收敛到入口层，服务层就保持纯函数式、可在测试里注入客户端。

Supabase 是**可选插件**：不配 `VITE_SUPABASE_*`，应用依然完整可用（Mock 模式）。
anon key 是公开密钥（受 RLS 约束），可随产物发布；service_role key 绝不可进前端。

## 6. UI 链路

- `App.tsx` 是唯一的编排层：`ViewState` 字符串状态机 + 所有异步 handler。
- 视图通过 `React.lazy` 按需加载；只有 `landing` 首屏是静态引入。
  - `index`（壳 + landing）≈ 439 kB
  - `Dashboard`（含 Recharts）≈ 341 kB
  - `CoursePlayer`（内联课程数据）≈ 54 kB
  - 其余视图各 5–20 kB
- 新增视图的三步：`types.ts` 加 `ViewState` 成员 → 新建 `components/Xxx.tsx` → 在 `App.tsx` 加 lazy + 分支。

## 7. 部署链路

```
push main
   └─ .github/workflows/deploy.yml
        pnpm install --frozen-lockfile
        BASE_PATH=/<repo>/ pnpm build      # 推导见 vite.config.ts
        cp dist/index.html dist/404.html   # SPA 兜底
        touch dist/.nojekyll
        upload-pages-artifact → deploy-pages
```

`base` 推导规则：

| 场景 | base |
|---|---|
| `BASE_PATH` 已设置 | 以它为准 |
| Actions 中 `GITHUB_REPOSITORY=owner/repo` | `/repo/` |
| 仓库名以 `.github.io` 结尾 | `/`（用户主页站点） |
| 本地 | `/` |

本地验证子路径构建：`BASE_PATH=/l2earn/ pnpm build && BASE_PATH=/l2earn/ pnpm preview`。

## 8. 扩展点

| 想加什么 | 改哪里 |
|---|---|
| 新的 OpenAI 兼容厂商 | `services/llm/presets.ts` 加一条预设（协议仍 `openai`） |
| 新协议（如 Gemini `generateContent`） | `services/llm/providers/` 新建适配器 + 注册进 `providers/index.ts` + `LlmProtocol` 联合类型 |
| 新的 AI 业务能力 | `services/llmService.ts` 加一个函数（prompt + 结构校验） |
| 新的持久化后端 | 替换 `services/dbService.ts` 的实现，保持导出函数签名 |
| 统一预置端点（自托管） | 把 `docs/config.example.js` 复制为 `public/config.js`，写 `window.__L2EARN_CONFIG__`（**不含 key**） |
| 新视图 | `types.ts` → `components/` → `App.tsx` 的 lazy + 分支 |

## 9. 验证

```bash
pnpm typecheck        # 应用层（不含测试/归档/e2e）
pnpm typecheck:test   # 测试层（jest 环境）
pnpm test             # 单测
pnpm build            # 生产构建
BASE_PATH=/l2earn/ pnpm build   # 子路径构建
```

## 10. 历史归档

`legacy/` 保存剥离 Google AI Studio 之前的两份快照（`dist-package/`、`l2earn-agent-package.zip`），
只用于追溯：**不参与构建、类型检查、测试**（见 `tsconfig.json` 的 `exclude`）。
