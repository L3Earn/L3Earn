# L2Earn 开发文档

面向要**改这个仓库的人**（包括未来的你）。
架构总览看 [ARCHITECTURE.md](./ARCHITECTURE.md)，协作与风格约定看 [AGENTS.md](../AGENTS.md)，
本文讲**怎么跑、怎么改、怎么测、怎么排查**。

---

## 目录

1. [快速开始](#1-快速开始)
2. [代码地图](#2-代码地图)
3. [分层硬规则](#3-分层硬规则)
4. [服务层 API 参考](#4-服务层-api-参考)
5. [一次 AI 请求的完整生命周期](#5-一次-ai-请求的完整生命周期)
6. [组件层约定](#6-组件层约定)
7. [开发指南（常见改动）](#7-开发指南常见改动)
8. [样式规范](#8-样式规范)
9. [测试指南](#9-测试指南)
10. [构建与部署](#10-构建与部署)
11. [调试手段](#11-调试手段)
12. [常见陷阱](#12-常见陷阱)
13. [已知缺口与后续方向](#13-已知缺口与后续方向)
14. [文档索引](#14-文档索引)

---

## 1. 快速开始

### 前置

- Node.js **22+**
- pnpm **11.28.5**（版本写在 `package.json` 的 `packageManager`，`corepack enable` 会自动对齐）
- 不需要任何 API key 就能启动；AI 功能在使用时由浏览器 BYOK 提供

### 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | Vite 开发服务器，http://localhost:3000 |
| `pnpm build` | 生产构建到 `dist/` |
| `pnpm preview` | 预览 `dist/`（默认 http://localhost:4173） |
| `pnpm typecheck` | 应用代码类型检查（`tsconfig.json`，**不含**测试/归档/e2e） |
| `pnpm typecheck:test` | 测试代码类型检查（`tsconfig.test.json`，CommonJS + jest 全局） |
| `pnpm test` | 跑 Jest（4 套件 33 用例） |
| `pnpm test:watch` / `pnpm test:coverage` / `pnpm test:ci` | 监听 / 覆盖率 / CI 模式 |
| `pnpm verify` | `typecheck && typecheck:test && test:ci && build` —— 提交前跑这个 |

单测定点执行：

```bash
pnpm test -- Dashboard.test.tsx            # 按文件名
pnpm test -- --testNamePattern="Anthropic" # 按用例名
```

### 子路径构建（模拟 GitHub Pages）

```bash
BASE_PATH=/L3Earn/ pnpm build
BASE_PATH=/L3Earn/ pnpm preview   # http://localhost:4173/L3Earn/
```

构建产物里资源前缀应为 `/L3Earn/assets/*`；如果是 `/assets/*`，说明 base 没生效。

---

## 2. 代码地图

```
入口层
  index.html           CSP、字体、#root、先加载 /config.js 再加载入口
  index.tsx            React 挂载；唯一读取 import.meta.env 的地方
  index.css            Tailwind 指令 + 基础样式 + 自定义工具类

编排层
  App.tsx (897)        ViewState 状态机 + 三份提升状态 + 全部业务 handler

视图层 components/
  LandingPage   (212)  落地页（首屏，静态引入）
  Dashboard     (261)  主面板 + AI 职业路线表单
  CoursePlayer  (1085) 课程播放器（**内容目前是内联静态数据**）
  CreatorStudio (611)  课程创作工作台（受控组件）
  LearningTree  (372)  AI 学习路线图时间轴
  Whitepaper    (349)  宣言页（中英双语）
  SettingsModal (641)  设置（通用/通知/隐私/**AI 引擎**）
  DebugPanel    (344)  调试抽屉（引擎状态 + 请求日志）
  AiTutor       (166)  AI 导学抽屉
  AuthModal     (143)  登录/注册（当前为前端模拟）

领域服务 services/
  llmService.ts (616)  AI 业务能力：prompt、JSON 校验、降级契约
  dbService.ts   (85)  数据持久化：Supabase 优先 → Mock 兜底
  supabase.ts    (34)  可选后端客户端（入口注入）
  runtimeInfo.ts (27)  base 路径 / dev-prod 标记（入口注入）

LLM 基础层 services/llm/
  index.ts       createLlmClient（唯一对外入口）
  types.ts       LlmConnection / LlmRequestOptions / LlmError / LlmSettings
  presets.ts     9 个厂商预设
  transport.ts   fetch + 超时 + 重试 + 错误归一化
  providers/     openai.ts / anthropic.ts（协议差异都在这）
  json.ts        JSON 抽取 + SVG 清洗
  diagnostics.ts 请求日志环形缓冲（调试面板）

数据/测试/归档
  types.ts             全局领域模型
  data/demoContent.ts  演示种子数据 + 演示登录凭据
  src/setupTests.ts    Jest 环境垫片（storage/observer/supabase mock）
  src/**/__tests__/    单测
  cypress/             e2e 截图脚本（需先 cypress install）
  legacy/              剥离 AI Studio 前的快照（不参与任何检查）
  docs/                本文档 + 架构图
```

---

## 3. 分层硬规则

违反这几条会立刻出问题，改代码前先读：

| 规则 | 为什么 |
|---|---|
| `components/` 只调 `services/llmService.ts` / `dbService.ts` 的导出函数，不直接 import `services/llm/providers/*` | 协议细节不外泄；UI 只依赖稳定契约 |
| `services/llm/*` 不得 import 业务类型（`CoursePlan` 等） | 它只收发文本，业务结构在 `llmService` 校验 |
| **`import.meta.env` 只允许出现在 `index.tsx`** | 它是 ESM 语法，`tsconfig.test.json`（CommonJS）解析不了；其余模块通过 `services/runtimeInfo.ts` / `configureSupabase()` 拿值 |
| 不允许把密钥写进构建期 | 产物公开；`vite.config.ts` 已无 `define` 注入 |
| 不允许引入第三方 `<script>` | CSP `script-src 'self'`；同源脚本能读到浏览器里的 key |
| 测试文件必须放进 `src/**/__tests__/` | 根 `tsconfig.json` 排除测试，由 `tsconfig.test.json` 单独检查 |

---

## 4. 服务层 API 参考

### 4.1 `services/llm/types.ts`

```ts
type LlmProtocol = 'openai' | 'anthropic'

interface LlmConnection {          // 一次可用的连接
  protocol: LlmProtocol
  baseUrl: string                  // 如 https://api.openai.com/v1
  chatPath: string                 // /chat/completions | /v1/messages
  apiKey: string
  model: string
}

interface LlmRequestOptions {
  messages: LlmMessage[]           // { role: 'system'|'user'|'assistant', content }
  system?: string                  // Anthropic 走顶层字段，OpenAI 变 system 消息
  temperature?: number
  maxTokens?: number
  json?: boolean                   // 尽量要求 JSON（不保证生效，解析层兜底）
  timeoutMs?: number; maxRetries?: number; signal?: AbortSignal
}

interface LlmResponse { text: string; model: string; usage?: LlmUsage; raw?: unknown }

class LlmError extends Error {
  code: LlmErrorCode; status?: number; retryable: boolean; detail?: string
}
```

`LlmErrorCode`：`no_api_key | auth | rate_limit | bad_request | not_found | server | network | timeout | aborted | bad_response`

### 4.2 `services/llmConfig.ts` —— BYOK 设置与密钥

| 导出 | 说明 |
|---|---|
| `DEFAULT_LLM_SETTINGS` | 默认设置（OpenAI / gpt-4o-mini / 0.7 / 60s / 1 次重试） |
| `loadLlmSettings()` / `saveLlmSettings(s)` | 非敏感设置存 localStorage（键 `l2earn.llm.settings.v1`） |
| `loadApiKey()` / `saveApiKey(key, remember)` / `clearApiKey()` | 密钥默认存 sessionStorage，勾选「记住」才落 localStorage（键 `l2earn.llm.key.v1`） |
| `maskApiKey(key)` | 只露头尾，用于 UI/诊断 |
| `resolveConnection(settings, key)` | 纯函数，设置 → `LlmConnection` |
| `checkReadiness(settings, key)` | `{ ready, problems[] }`，用于横幅与拦截 |
| `describeLlmSettings(settings, key)` | UI 摘要（**永不返回明文 key**） |
| `readRuntimeDefaults()` | 读取 `window.__L2EARN_CONFIG__.llm`（`public/config.js` 注入） |
| `LLM_PRESETS` / `getPreset(id)` | 预设列表（见 4.3） |

**优先级**：运行时默认值 < 用户保存的设置；key 永远只来自存储，不进代码。

### 4.3 `services/llm/`

| 模块 | 导出 | 说明 |
|---|---|---|
| `index.ts` | `createLlmClient(connection, defaults?)` | 返回 `{ connection, request(options) }`；自动埋点诊断日志 |
| `presets.ts` | `LLM_PRESETS`, `getPreset`, `DEFAULT_PRESET_ID` | 预设：`openai` `anthropic` `deepseek` `moonshot` `minimax` `openrouter` `zhipu` `ollama` `custom` |
| `transport.ts` | `postJson`, `readErrorMessage` | 超时（默认 60s）、重试（仅网络/408/429/5xx）、错误码映射 |
| `providers/index.ts` | `PROVIDERS`, `getProvider`, `joinEndpoint` | 协议 → 适配器 |
| `providers/openai.ts` | `openaiAdapter` | Bearer 鉴权；`choices[0].message.content`；`response_format` |
| `providers/anthropic.ts` | `anthropicAdapter` | `x-api-key` + `anthropic-version` + `anthropic-dangerous-direct-browser-access`；顶层 `system`；`max_tokens` 必填；`content[].text` |
| `json.ts` | `extractJsonText`, `parseJsonObject`, `sanitizeSvg`, `isNonEmptyString`, `asStringArray` | 去围栏抽 JSON；SVG 去 `<script>`/`on*`/`javascript:` |
| `diagnostics.ts` | `getLlmLogs`, `subscribeLlmLogs`, `clearLlmLogs` | 50 条内存环形缓冲；**不记录 key/请求头/正文** |

### 4.4 `services/llmService.ts` —— 业务 AI 能力

所有函数**每次调用都重新读设置**，所以改完设置立即生效。

| 函数 | 返回 | 失败时 |
|---|---|---|
| `isLlmReady()` | `{ ready, problems }` | — |
| `getLLMConfig()` | `{ provider, protocol, baseUrl, model, hasKey, ready }` | — |
| `sendMessageToTutor(history, newMessage, context?, { signal }?)` | `Promise<string>` | 返回可展示的降级文案（未配置 key 会提示去设置） |
| `polishInsight(rawNotes)` | `Promise<{ title, content, tags }>` | 返回 `{ title: 'Draft Insight', content: rawNotes, tags: ['draft'] }` |
| `generateCareerPath(role, interests, goal, language='en')` | `Promise<string>`（Markdown） | `'Unable to generate career path at this time.'` |
| `generateCourseOutline(topic, audience, difficulty, tone, language='en')` | `Promise<CoursePlan \| null>` | `null` |
| `generateModuleContent(moduleTitle, topic, audience, tone, language='en')` | `Promise<LessonContent \| null>` | `null` |
| `generateLearningTree(role, goal, interests, language='en')` | `Promise<LearningPathData \| null>` | `null` |
| `testLlmConnection()` | `Promise<{ ok, message, latencyMs?, model? }>` | `ok:false` + 中文原因 |

**失败语义是契约**：文本类降级为文案、结构化类降级为 `null`，调用方据此决定 UI 提示。

结构校验（AI 输出不可信）：
- `CoursePlan`：`courseTitle` 非空 + 至少 1 个合法 `modules[]`
- `LessonContent`：`rrTree` 合法 + `quiz[].correctAnswer` 越界归零 + `svgSource` 清洗
- `LearningPathData`：`nodes[]` 非空 + `strategy` 归一为 `CREATE|CONSUME` + `salarySources` 过滤

### 4.5 `services/dbService.ts` 与 `services/supabase.ts`

```ts
// supabase.ts（只由 index.tsx 注入一次）
configureSupabase(url?, anonKey?): SupabaseClient | null
getSupabaseClient(): SupabaseClient | null
isSupabaseConfigured(): boolean

// dbService.ts
getCourses(): Promise<Course[]>                 // Supabase 优先 → 10 条 Mock（未配置时延迟 500ms）
saveLearningPath(userId, path): Promise<boolean> // 未配置则 console.log 模拟
getCurrentUser(): Promise<User | null>
signIn(): Promise<void>                          // 目前是 alert 占位
```

### 4.6 `services/runtimeInfo.ts`

```ts
configureRuntimeInfo({ baseUrl, mode })  // 只在 index.tsx 调
getRuntimeInfo(): { baseUrl, mode }
isDev(): boolean
```

---

## 5. 一次 AI 请求的完整生命周期

以 `generateCourseOutline` 为例：

```
App.handleStudioGenerateOutline()
        │
        ▼
llmService.generateCourseOutline(topic, audience, difficulty, tone, language)
        │ ① buildClient()
        │    loadLlmSettings() + loadApiKey() → checkReadiness()
        │    未就绪 → throw LlmError('no_api_key')
        │    resolveConnection() → createLlmClient(connection, {temperature, timeoutMs, maxRetries})
        ▼
client.request({ messages, system, json: true })
        │ ② getProvider(protocol) → adapter.endpoint/headers/body
        ▼
transport.postJson(url, headers, body, { timeoutMs, maxRetries })
        │ ③ AbortController 超时 + 重试（网络/408/429/5xx）
        │    非 2xx → LlmError(codeForStatus(status))
        ▼
provider.parse(connection, payload)   // choices[] 或 content[]
        │ ④ 空文本 → LlmError('bad_response')
        │    成功/失败都写 diagnostics
        ▼
llmService: parseJsonObject(text) → normalizeCoursePlan()
        │ ⑤ JSON 模式失败（bad_request）自动降级重试一次非 JSON
        │    解析/校验失败 → null
        ▼
App: setStudioState(plan | null)
```

---

## 6. 组件层约定

- 除 `LandingPage` 外，所有视图都是 **`React.lazy` 按需加载**；新增视图照此办理。
- 视图一律是**受控组件**：状态提升在 `App.tsx`，组件只吃 `props` + 回调，不直接调服务。
- Props 命名约定：`state`（数据/加载态）+ `onXxx`（回调）。

| 组件 | Props |
|---|---|
| `Dashboard` | `state{form,path,isGenerating}`, `onFormChange(field,value)`, `onGenerate`, `onReset`, `onNavigateToTree` |
| `LearningTree` | `onChangeView`, `state{form,data,isGenerating,isSaved,error}`, `onFormChange`, `onGenerate(role?,goal?,interests?)`, `onSave`, `onReset`, `onConfigureStudio` |
| `CreatorStudio` | `state{topic,audience,difficulty,tone,plan,isGenerating,generatingModuleIndex}`, `onStateChange`, `onGenerate`, `onGenerateContent(i)`, `onDiscard`, `onPublish`, `onNavigateToTree` |
| `CoursePlayer` | `onBack`, `courseId?`（默认 `'1'`） |
| `AiTutor` | `isOpen`, `onClose`, `contextContent?`, `contextLabel?`, `onClearContext?` |
| `SettingsModal` | `isOpen`, `onClose`, `onLogout`, `user`, `onLlmSettingsChange?` |
| `DebugPanel` | `isOpen`, `onClose`, `onOpenSettings`, `onLlmSettingsChange?` |
| `AuthModal` | `isOpen`, `onClose`, `onLogin(email)` |
| `LandingPage` | `onGetStarted`, `onSignIn`, `onReadManifesto` |
| `Whitepaper` | `onBack` |

---

## 7. 开发指南（常见改动）

### 加一个厂商（OpenAI 兼容）

只改 `services/llm/presets.ts`，加一条：

```ts
{ id: 'foo', label: 'Foo AI', protocol: 'openai',
  baseUrl: 'https://api.foo.ai/v1', chatPath: '/chat/completions',
  defaultModel: 'foo-chat', models: ['foo-chat'], requiresKey: true },
```

设置页下拉会自动出现（`SettingsModal` 遍历 `LLM_PRESETS`）。

### 加一种协议（例如 Gemini `generateContent`）

1. `services/llm/types.ts`：`LlmProtocol` 加成员。
2. 新建 `services/llm/providers/gemini.ts`，实现 `LlmProviderAdapter` 四个方法：
   `endpoint / headers / body / parse`。
3. `providers/index.ts` 注册进 `PROVIDERS`。
4. `llmConfig.defaultChatPath()` 补一条默认路径。
5. 补一条单测（参考 `src/services/__tests__/llmService.test.ts` 的 Anthropic 用例）。

### 加一个 AI 业务能力

在 `services/llmService.ts` 里加函数，模板：

```ts
export const generateXxx = async (...args): Promise<Xxx | null> => {
  try {
    const client = buildClient()                       // 复用连接
    const text = await requestText(client, { system: SYSTEM_INSTRUCTION, json: true, messages: [...] })
    return normalizeXxx(parseJsonObject(text))          // 结构校验，不合法返回 null
  } catch (error) {
    logLlmFailure('xxx', error)                         // 只记错误码，不记密钥
    return null
  }
}
```

### 加一个视图

1. `types.ts` 的 `ViewState` 加成员。
2. 新建 `components/Xxx.tsx`（受控组件）。
3. `App.tsx`：加 `React.lazy` 导入 + 侧栏 `NavItem` + 渲染分支 + handler。

### 接真实鉴权（替换 mock）

`components/AuthModal.tsx` 的 `handleSubmit` 目前是 `setTimeout` 假登录。
接 Supabase 时：改为 `supabase.auth.signInWithPassword()`，失败态回到表单；
同时把 `data/demoContent.ts` 的 `DEMO_AUTH_PREFILL` 置 `false`。

### 接真实数据

`services/dbService.ts` 保持导出签名不变，替换内部实现即可；
若换后端，只改这个文件 + `services/supabase.ts` 的注入。

---

## 8. 样式规范

- **Tailwind v3 本地构建**（`tailwindcss` + `postcss` + `autoprefixer`），**不是 CDN**。
- `tailwind.config.js` 的 `content` 覆盖：`index.html`、`index.tsx`、`App.tsx`、`components/**`、`src/**`。
  新增目录要同步加进去，否则类名不会生成。
- 自定义动画（`animate-fade-in` / `animate-scale-up` / `animate-gradient-x`）定义在
  `tailwind.config.js` 的 `keyframes` + `animation`，不要在组件里写 `<style>`。
- ⚠️ **动态拼接的类名不会生效**：`ml-${level * 4}`、`bg-${color}-600` 这类 Tailwind 扫不到。
  用完整字面量映射表，或内联 `style`。
- CSP 允许 `style-src 'unsafe-inline'`（组件里有内联样式），但**不允许**第三方脚本。

---

## 9. 测试指南

### 两套 tsconfig 分工

| 配置 | 覆盖 | module | types |
|---|---|---|---|
| `tsconfig.json` | 应用代码 | ESNext/bundler | node, vite/client, jest |
| `tsconfig.test.json` | `src/**`、`components/**`、`services/**` | CommonJS | node, jest |

根配置排除了 `legacy/`、`cypress/`（chai 全局 `expect` 与 jest 冲突）、`src/**/__tests__/**`。

### 现状

4 个套件 / 33 个用例：

| 文件 | 覆盖 |
|---|---|
| `llmService.test.ts` | 双协议请求形状、鉴权头、JSON 围栏抽取、结构校验、SVG 清洗、降级契约 |
| `diagnostics.test.ts` | 环形缓冲、订阅、请求埋点（并断言日志里**不含 key**） |
| `dbService.test.ts` | Supabase 优先 / 失败回退 Mock / Mock 模式 |
| `Dashboard.test.tsx` | 渲染 + 交互 |

### 写测试的约定

- 网络：`global.fetch = jest.fn()`，按用例排队 `mockResolvedValueOnce`。
- 存储：`window.localStorage.clear()` / `sessionStorage.clear()`（`src/setupTests.ts` 已 mock supabase）。
- BYOK 配置：用 `saveLlmSettings()` + `saveApiKey()` 造状态，不要 mock 整个 `llmConfig`。
- 覆盖率口径：`collectCoverageFrom` 统计 `App.tsx`、`types.ts`、`components/**`、`services/**`；
  当前是**趋势指标**（阈值 0），补齐组件测试后再把门禁打开。

### e2e

`cypress/e2e/preview.cy.js` 只做落地页截图。首次运行需要：
`pnpm exec cypress install`（安装依赖时跳过了 postinstall）。

---

## 10. 构建与部署

```
pnpm build
  ├─ Vite 读取 base（BASE_PATH > GITHUB_REPOSITORY > /）
  ├─ React.lazy 产出分 chunk：index 439kB / Dashboard 341kB / CoursePlayer 54kB / 其余 5–20kB
  ├─ Tailwind 编译出带 hash 的 CSS
  └─ public/ 原样拷贝（config.js）

GitHub Actions（.github/workflows/deploy.yml）
  pnpm install --frozen-lockfile
  BASE_PATH=/${{ github.event.repository.name }}/ pnpm build
  cp dist/index.html dist/404.html   # SPA 兜底
  touch dist/.nojekyll
  upload-pages-artifact → deploy-pages
```

**部署前置**：仓库 Settings → Pages → Source 选 **GitHub Actions**；分支 `main`。

本地复现线上路径：

```bash
BASE_PATH=/L3Earn/ pnpm build
grep -o 'src="[^"]*"' dist/index.html     # 应看到 /L3Earn/assets/... 与 /L3Earn/config.js
BASE_PATH=/L3Earn/ pnpm preview
```

---

## 11. 调试手段

| 手段 | 位置 | 用途 |
|---|---|---|
| **AI 请求日志** | 侧边栏「调试」→ 请求日志 | 协议、模型、耗时、状态码、错误码、token 用量；刷新即清空 |
| **测试连接** | 调试面板 或 设置 → AI 引擎 | 发一次极短请求，返回延迟或具体失败原因 |
| **复制诊断信息** | 调试面板右上角 | 预设/端点/模型/掩码 key/环境 + 最近 10 条请求 |
| **DSH 侧边栏 Browser** | DSH 右侧栏 + → Browser | 输入 `http://localhost:3000`，改代码时 HMR 就地刷新 |
| **Vite 日志** | dev server 终端 | 模块解析失败、HMR 更新、构建错误 |

错误码 → 常见原因：

| 错误码 | 先查什么 |
|---|---|
| `auth` (401/403) | key 是否有效、是否有该模型权限、账单是否欠费 |
| `not_found` (404) | `baseUrl` 少/多了 `/v1`；模型名拼写；自定义端点路径 |
| `network` | CORS 被拒（浏览器 Network 面板看 preflight）、端点写错、断网 |
| `timeout` | 超时设太小、端点慢、代理问题 |
| `rate_limit` (429) | 额度/并发限制；调大 `maxRetries` |
| `bad_request` (400) | 模型不支持某参数（如 `response_format`）；会自动降级重试一次 |
| `bad_response` | 端点返回结构不是 OpenAI/Anthropic 格式 → 换协议或换端点 |
| `no_api_key` | 设置里没填 key，或预设 `requiresKey` 但留空 |

---

## 12. 常见陷阱

1. **`process.env` 在浏览器里不存在**。Vite 会把 `process.env` 替换成空对象，
   `process.env.SUPABASE_URL` 恒为 `undefined` → 永远 Demo 模式。
   正确做法：构建期值用 `import.meta.env.VITE_*`（只在 `index.tsx` 读），运行时值用 localStorage。
2. **`import.meta` 会让 Jest 崩**（CJS 不支持）。所以组件/服务里出现 `import.meta.env` 就会被
   `pnpm typecheck:test` 拦下 —— 这是设计，不是 bug。
3. **Tailwind 动态类名失效**：见第 8 节。
4. **`dangerouslySetInnerHTML`**：AI 生成的 SVG 进 DOM 前必须过 `sanitizeSvg()`；
   `CoursePlayer` 与 `CreatorStudio` 都走这条路径。CSP 是第二道防线。
5. **CORS**：浏览器直连第三方端点，没有代理；端点必须放行跨域。
   Anthropic 还需 `anthropic-dangerous-direct-browser-access`（适配器自动加）。
6. **静态托管没有服务端路由**：刷新 `/L3Earn/xxx` 需要 `dist/404.html` 兜底；
   当前应用是单页状态机，只有根路径，暂无深链问题。
7. **`.env` 不再影响 AI 配置**：AI 是运行时 BYOK；`.env` 只用于可选的 `VITE_SUPABASE_*`。
8. **`legacy/` 不参与任何检查**：别把新代码放进 `legacy/`，也别指望里面能编译。

---

## 13. 已知缺口与后续方向

| 缺口 | 影响 | 建议 |
|---|---|---|
| CoursePlayer 内容是硬编码静态数据（仅课程 1/88/99） | AI 生成的模块内容无法播放，「Studio → 播放」链路断路 | 让 CoursePlayer 消费 `CoursePlan` / `lesson content` |
| 登录是前端 mock（`setTimeout` + 伪造 user） | 无真实鉴权 | 接 Supabase Auth，关掉 `DEMO_AUTH_PREFILL` |
| 发布课程/Insight 是 `alert()` | 无落库 | 接 `dbService` + 真实后端 |
| Supabase 表结构未建 | 配置了也只能读空表 | 写 schema（users / courses / modules / user_progress） |
| `prose-*` 类缺 `@tailwindcss/typography` | Markdown 排版无效果 | 装插件或改用自定义排版 |
| 组件测试覆盖低 | 回归风险 | 逐步补 Dashboard/LearningTree 交互测试 |

更长期的目标见 [roadmap.md](../roadmap.md)（Next.js 全栈化、服务端 AI 代理、Web3 经济系统）。

---

## 14. 文档索引

| 文档 | 内容 |
|---|---|
| [README.md](../README.md) | 这是什么、怎么跑、怎么部署、BYOK 怎么配 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 分层与依赖方向、三条运行边界、扩展点 |
| **DEVELOPMENT.md**（本文） | 开发手册：API 参考、改动指南、测试、排障 |
| [AGENTS.md](../AGENTS.md) | 协作约定：命名、目录、风格、提交前检查 |
| [roadmap.md](../roadmap.md) | 产品与技术路线（愿景，非现状） |
| [config.example.js](./config.example.js) | 部署方预置端点/模型的运行时配置示例 |
