/// <reference types="vite/client" />

/**
 * Vite 客户端类型入口。
 * 这行 `/// <reference types="vite/client" />` 提供 `*.css` 等静态资源导入声明，
 * 以及 `import.meta.env` 的类型（index.tsx 里的 `import './index.css'` 依赖它）。
 *
 * 关于 LLM 配置：
 * AI 层是「浏览器端 BYOK + 运行时配置」，不通过构建期变量注入
 * （构建期注入会把 key 或配置写死进产物）。
 * 因此这里不声明任何 LLM_* 环境变量；相关配置见 `services/llm/*` 与
 * `services/llmConfig.ts`（运行时读取，key 只保存在用户浏览器）。
 */

/**
 * 允许的构建期环境变量（只有 VITE_ 前缀会被注入前端）。
 * AI 端点/模型/密钥**不在此列**——那是运行时 BYOK 配置。
 */
interface ImportMetaEnv {
  /** 可选后端：Supabase 项目地址 */
  readonly VITE_SUPABASE_URL?: string;
  /** 可选后端：Supabase anon key（公开密钥，受 RLS 约束） */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
