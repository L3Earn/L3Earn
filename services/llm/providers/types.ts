import type {
  LlmConnection,
  LlmRequestOptions,
  LlmResponse,
  LlmUsage,
} from "../types";

/**
 * 协议适配器：把「统一的请求描述」翻译成各家 HTTP 请求，再把响应翻译回统一结构。
 * 新增一种协议只需实现这个接口并注册到 providers/index.ts。
 */
export interface LlmProviderAdapter {
  protocol: LlmConnection["protocol"];
  /** 由 baseUrl + chatPath 推导最终 endpoint；兼容用户直接粘贴完整 URL 的情况 */
  endpoint(connection: LlmConnection): string;
  headers(connection: LlmConnection): Record<string, string>;
  body(connection: LlmConnection, request: LlmRequestOptions): unknown;
  parse(connection: LlmConnection, payload: unknown): LlmResponse;
}

/** 拼接 endpoint：允许用户把完整路径直接填进 baseUrl */
export const joinEndpoint = (baseUrl: string, chatPath: string): string => {
  const base = baseUrl.trim().replace(/\/+$/, "");
  const path = chatPath.trim();
  if (!base) return path;
  if (!path) return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // 用户已把完整路径粘进 baseUrl（例如 https://x.com/v1/chat/completions）
  if (base.endsWith(normalized)) return base;
  return `${base}${normalized}`;
};

export const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/** 把 OpenAI usage / Anthropic usage 统一成 LlmUsage */
export const normalizeUsage = (usage: unknown): LlmUsage | undefined => {
  const record = asRecord(usage);
  if (!record) return undefined;
  const input =
    typeof record.prompt_tokens === "number"
      ? record.prompt_tokens
      : typeof record.input_tokens === "number"
        ? record.input_tokens
        : undefined;
  const output =
    typeof record.completion_tokens === "number"
      ? record.completion_tokens
      : typeof record.output_tokens === "number"
        ? record.output_tokens
        : undefined;
  if (input === undefined && output === undefined) return undefined;
  return { inputTokens: input, outputTokens: output };
};
