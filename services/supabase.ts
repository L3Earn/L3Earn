import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 是**可选后端**：未配置时整个应用走内置 Mock 数据（Demo 模式）。
 *
 * 配置只在「入口层」读取一次（index.tsx 调用 configureSupabase），
 * 服务层不直接碰环境变量，原因：
 * - 浏览器里没有 process 对象；旧写法 `process.env.SUPABASE_URL` 会被 Vite
 *   替换成空对象，导致配置恒为空（永远 demo 模式）。
 * - `import.meta.env` 是 Vite 的标准注入方式，但它是 ESM 语法，CJS 环境（Jest）
 *   无法解析；把环境读取收敛到入口层，服务层就保持纯粹、可在测试里注入。
 *
 * 安全性：VITE_SUPABASE_ANON_KEY 是**公开**密钥（受 RLS 约束），可随前端发布；
 * service_role key 绝不能出现在前端。
 */
let client: SupabaseClient | null = null;

/** 由入口层调用一次；不传或参数为空则保持 Demo 模式 */
export const configureSupabase = (
  url?: string,
  anonKey?: string,
): SupabaseClient | null => {
  const trimmedUrl = (url ?? '').trim();
  const trimmedKey = (anonKey ?? '').trim();
  client =
    trimmedUrl && trimmedKey ? createClient(trimmedUrl, trimmedKey) : null;
  return client;
};

/** 服务层通过它取客户端；未配置返回 null */
export const getSupabaseClient = (): SupabaseClient | null => client;

export const isSupabaseConfigured = (): boolean => client !== null;
