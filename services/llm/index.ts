import { LlmError } from "./types";
import type {
  LlmConnection,
  LlmRequestOptions,
  LlmResponse,
} from "./types";
import { getProvider } from "./providers";
import { postJson } from "./transport";
import { nextLogId, recordLlmLog } from "./diagnostics";

/**
 * 统一客户端：调用方只关心「发一句话、拿一段文本」，
 * 协议差异（OpenAI / Anthropic）由 providers 层吸收。
 */

export interface LlmClient {
  connection: LlmConnection;
  request(options: LlmRequestOptions): Promise<LlmResponse>;
}

const assertConnection = (connection: LlmConnection) => {
  if (!connection.baseUrl) {
    throw new LlmError("bad_request", "未配置服务地址（baseUrl）");
  }
  if (!connection.model) {
    throw new LlmError("bad_request", "未配置模型（model）");
  }
  if (!connection.apiKey && connection.protocol === "anthropic") {
    throw new LlmError("no_api_key", "Anthropic 需要 API key");
  }
};

export const createLlmClient = (
  connection: LlmConnection,
  defaults: { temperature?: number; timeoutMs?: number; maxRetries?: number } = {},
): LlmClient => ({
  connection,
  async request(options: LlmRequestOptions): Promise<LlmResponse> {
    assertConnection(connection);
    const provider = getProvider(connection.protocol);
    const url = provider.endpoint(connection);
    const startedAt = Date.now();
    const id = nextLogId();

    try {
      const { body, status } = await postJson(
        url,
        provider.headers(connection),
        provider.body(connection, options),
        {
          timeoutMs: options.timeoutMs ?? defaults.timeoutMs,
          maxRetries: options.maxRetries ?? defaults.maxRetries,
          signal: options.signal,
        },
      );

      const response = provider.parse(connection, body);
      recordLlmLog({
        id,
        startedAt,
        durationMs: Date.now() - startedAt,
        protocol: connection.protocol,
        model: response.model || connection.model,
        url,
        jsonMode: Boolean(options.json),
        ok: true,
        status,
        usage: response.usage,
        textLength: response.text.length,
      });
      return response;
    } catch (error) {
      // 只记录元信息：错误码/状态/信息，绝不记录请求头或密钥
      recordLlmLog({
        id,
        startedAt,
        durationMs: Date.now() - startedAt,
        protocol: connection.protocol,
        model: connection.model,
        url,
        jsonMode: Boolean(options.json),
        ok: false,
        status: error instanceof LlmError ? error.status : undefined,
        errorCode: error instanceof LlmError ? error.code : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});

export { LlmError } from "./types";
export type { LlmConnection, LlmRequestOptions, LlmResponse } from "./types";
export { LLM_PRESETS, getPreset, DEFAULT_PRESET_ID } from "./presets";
export type { LlmPreset } from "./presets";
