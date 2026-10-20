/**
 * 运行时环境信息（由入口层注入一次）。
 *
 * 架构规则：`import.meta.env` 只在 index.tsx 读取一次。
 * 原因与 Supabase 配置相同——`import.meta` 是 ESM 语法，Jest（CJS）无法解析；
 * 把它收敛到入口，组件层就能被测试环境正常加载。
 */

export interface RuntimeInfo {
  /** 站点 base（如 `/` 或 `/l2earn/`），来自 Vite 的 BASE_URL */
  baseUrl: string;
  /** 'dev' | 'prod' */
  mode: "dev" | "prod";
}

const DEFAULT_INFO: RuntimeInfo = { baseUrl: "/", mode: "prod" };

let current: RuntimeInfo = DEFAULT_INFO;

export const configureRuntimeInfo = (next: Partial<RuntimeInfo>): RuntimeInfo => {
  current = { ...current, ...next };
  return current;
};

export const getRuntimeInfo = (): RuntimeInfo => current;

export const isDev = (): boolean => current.mode === "dev";
