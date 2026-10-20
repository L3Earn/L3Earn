import { LlmError } from "../types";
import type { LlmConnection, LlmRequestOptions, LlmResponse } from "../types";
import { asArray, asRecord, joinEndpoint, normalizeUsage } from "./types";
import type { LlmProviderAdapter } from "./types";

/** Anthropic 要求显式版本号，历史上长期稳定在这个值 */
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Anthropic Messages 协议（与 OpenAI 的差异都在这里消化）：
 * - endpoint 是 /v1/messages，鉴权是 x-api-key 而不是 Authorization: Bearer
 * - system 提示词是顶层字段，不放在 messages 里
 * - max_tokens 必填
 * - 响应是 content: [{type:'text', text}] 而不是 choices[0].message.content
 * - 浏览器直连必须带 anthropic-dangerous-direct-browser-access，
 *   否则 CORS 预检会被拒（BYOK 纯前端场景必需）
 */
export const anthropicAdapter: LlmProviderAdapter = {
  protocol: "anthropic",

  endpoint: (connection: LlmConnection) =>
    joinEndpoint(connection.baseUrl, connection.chatPath),

  headers: (connection: LlmConnection) => ({
    "Content-Type": "application/json",
    "x-api-key": connection.apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-dangerous-direct-browser-access": "true",
  }),

  body: (connection: LlmConnection, request: LlmRequestOptions) => {
    const messages = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));

    const body: Record<string, unknown> = {
      model: connection.model,
      // Anthropic 必填；给一个足够容纳课程 JSON 的默认值
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      messages,
    };

    const system = request.system;
    if (system) {
      // 用 JSON 模式的场景直接要求模型只输出 JSON
      body.system = request.json
        ? `${system}\n\nRespond with a single valid JSON object and nothing else. No markdown fences.`
        : system;
    }
    return body;
  },

  parse: (connection: LlmConnection, payload: unknown): LlmResponse => {
    const record = asRecord(payload);
    const blocks = asArray(record?.content);
    const text = blocks
      .map((block) => {
        const item = asRecord(block);
        return item?.type === "text" && typeof item.text === "string"
          ? item.text
          : "";
      })
      .join("");

    if (!text) {
      throw new LlmError("bad_response", "响应里没有可用的文本内容", {
        detail: JSON.stringify(payload).slice(0, 500),
      });
    }

    return {
      text,
      model: typeof record?.model === "string" ? record.model : connection.model,
      usage: normalizeUsage(record?.usage),
      raw: payload,
    };
  },
};
