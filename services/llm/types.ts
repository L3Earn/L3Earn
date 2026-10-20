/**
 * 开放式 LLM 层的公共类型。
 *
 * 设计目标：
 * - 不绑定任何厂商；只要实现「OpenAI Chat Completions」或「Anthropic Messages」
 *   两种协议之一，就能接入本应用。
 * - 密钥不参与构建：默认由用户在浏览器里自行填写（BYOK），见 services/llmConfig.ts。
 */

/** 协议：决定请求体与解析方式，而不是厂商 */
export type LlmProtocol = "openai" | "anthropic";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 一次可用的连接配置。
 * baseUrl 是服务根地址（OpenAI 兼容通常以 /v1 结尾；Anthropic 是 https://api.anthropic.com），
 * chatPath 是相对路径（Anthropic 为 /v1/messages，OpenAI 兼容为 /chat/completions）。
 */
export interface LlmConnection {
  protocol: LlmProtocol;
  baseUrl: string;
  chatPath: string;
  apiKey: string;
  model: string;
}

/** 单次请求的可选参数 */
export interface LlmRequestOptions {
  messages: LlmMessage[];
  /** 系统提示词；Anthropic 走顶层 system 字段，OpenAI 走 system 消息 */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** 尽量要求模型返回 JSON（各厂商支持程度不同，调用方仍应自行兜底解析） */
  json?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

export interface LlmUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface LlmResponse {
  text: string;
  model: string;
  usage?: LlmUsage;
  raw?: unknown;
}

export type LlmErrorCode =
  | "no_api_key"
  | "auth"
  | "rate_limit"
  | "bad_request"
  | "not_found"
  | "server"
  | "network"
  | "timeout"
  | "aborted"
  | "bad_response";

export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly detail?: string;

  constructor(
    code: LlmErrorCode,
    message: string,
    options: { status?: number; retryable?: boolean; detail?: string } = {},
  ) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.detail = options.detail;
  }
}

/** 由一个 preset + 用户覆盖项推导出的完整连接信息 */
export interface LlmSettings {
  /** 预设 id，见 services/llm/presets.ts */
  presetId: string;
  /** 允许脱离预设直接改写协议/地址/模型（自定义端点） */
  protocol: LlmProtocol;
  baseUrl: string;
  /** 可选：自定义端点路径；留空则按协议取默认值 */
  chatPath?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  timeoutMs: number;
  maxRetries: number;
  /** 是否把 key 持久化到 localStorage；关掉则只放 sessionStorage */
  rememberKey: boolean;
}

/** 可通过 public/config.js 预置的运行时配置（不含密钥） */
export interface L2EarnRuntimeConfig {
  llm?: Partial<Omit<LlmSettings, "rememberKey">> & { rememberKey?: boolean };
}

declare global {
  interface Window {
    __L2EARN_CONFIG__?: L2EarnRuntimeConfig;
  }
}
