/**
 * LLM 诊断日志：内存环形缓冲，仅供本地/调试面板使用。
 *
 * 为什么要它：
 * BYOK 是浏览器直连第三方端点，失败原因（CORS、鉴权、模型名、限流）
 * 只能从网络层看到；控制台里翻 fetch 日志很低效。这里把每次请求的
 * 「协议 / 端点 / 模型 / 耗时 / 状态 / 错误码」记录下来，供侧边栏调试面板展示。
 *
 * 安全约束：
 * - 绝不记录 API key、请求头、完整响应体（可能含用户隐私内容）
 * - 只记录长度与用量等元信息
 * - 缓冲上限 50 条，纯内存，刷新即清空
 */

import type { LlmProtocol, LlmUsage } from "./types";

export interface LlmLogEntry {
  id: string;
  /** 发起时间（ms epoch） */
  startedAt: number;
  /** 总耗时，含重试 */
  durationMs: number;
  protocol: LlmProtocol;
  model: string;
  /** 最终请求地址（不含 query 中的敏感参数） */
  url: string;
  jsonMode: boolean;
  ok: boolean;
  /** HTTP 状态码（成功或失败都可能有） */
  status?: number;
  errorCode?: string;
  errorMessage?: string;
  usage?: LlmUsage;
  /** 回复文本长度，用于判断「拿到了空响应」 */
  textLength?: number;
}

const MAX_ENTRIES = 50;

let entries: LlmLogEntry[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

/** 最新在前 */
export const getLlmLogs = (): LlmLogEntry[] => entries;

export const subscribeLlmLogs = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const recordLlmLog = (entry: LlmLogEntry): void => {
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  emit();
};

export const clearLlmLogs = (): void => {
  entries = [];
  emit();
};

let sequence = 0;
export const nextLogId = (): string => {
  sequence += 1;
  return `req-${sequence}`;
};
