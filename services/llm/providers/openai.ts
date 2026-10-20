import { LlmError } from "../types";
import type { LlmConnection, LlmRequestOptions, LlmResponse } from "../types";
import { asArray, asRecord, joinEndpoint, normalizeUsage } from "./types";
import type { LlmProviderAdapter } from "./types";

/**
 * OpenAI Chat Completions 协议。
 * 覆盖：OpenAI、DeepSeek、Moonshot、MiniMax、OpenRouter、智谱、Ollama、
 * 以及任何自托管的 /v1/chat/completions 兼容服务。
 */
export const openaiAdapter: LlmProviderAdapter = {
  protocol: "openai",

  endpoint: (connection: LlmConnection) =>
    joinEndpoint(connection.baseUrl, connection.chatPath),

  headers: (connection: LlmConnection) => ({
    "Content-Type": "application/json",
    ...(connection.apiKey ? { Authorization: `Bearer ${connection.apiKey}` } : {}),
  }),

  body: (connection: LlmConnection, request: LlmRequestOptions) => {
    const messages = [
      ...(request.system
        ? [{ role: "system" as const, content: request.system }]
        : []),
      ...request.messages.filter((message) => message.role !== "system"),
    ];
    const body: Record<string, unknown> = {
      model: connection.model,
      messages,
      temperature: request.temperature ?? 0.7,
    };
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
    // JSON 模式并非所有兼容端点都支持；失败时调用方会退回到「从文本里抽 JSON」
    if (request.json) body.response_format = { type: "json_object" };
    return body;
  },

  parse: (connection: LlmConnection, payload: unknown): LlmResponse => {
    const record = asRecord(payload);
    const choice = asRecord(asArray(record?.choices)[0]);
    const message = asRecord(choice?.message);
    const content = message?.content;

    let text = "";
    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      // 部分网关把 content 拆成 [{type:'text', text:'...'}]
      text = content
        .map((part) => {
          const item = asRecord(part);
          return typeof item?.text === "string" ? item.text : "";
        })
        .join("");
    }

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
