import { LlmError } from "./types";
import type {
  LlmConnection,
  LlmRequestOptions,
  LlmResponse,
} from "./types";
import { getProvider } from "./providers";
import { postJson } from "./transport";

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

    const { body } = await postJson(
      provider.endpoint(connection),
      provider.headers(connection),
      provider.body(connection, options),
      {
        timeoutMs: options.timeoutMs ?? defaults.timeoutMs,
        maxRetries: options.maxRetries ?? defaults.maxRetries,
        signal: options.signal,
      },
    );

    return provider.parse(connection, body);
  },
});

export { LlmError } from "./types";
export type { LlmConnection, LlmRequestOptions, LlmResponse } from "./types";
export { LLM_PRESETS, getPreset, DEFAULT_PRESET_ID } from "./presets";
export type { LlmPreset } from "./presets";
