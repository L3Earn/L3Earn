import { LlmError } from "../types";
import type { LlmProtocol } from "../types";
import { anthropicAdapter } from "./anthropic";
import { openaiAdapter } from "./openai";
import type { LlmProviderAdapter } from "./types";

export const PROVIDERS: Record<LlmProtocol, LlmProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
};

export const getProvider = (protocol: LlmProtocol): LlmProviderAdapter => {
  const provider = PROVIDERS[protocol];
  if (!provider) {
    throw new LlmError("bad_request", `不支持的协议: ${protocol}`);
  }
  return provider;
};

export type { LlmProviderAdapter };
export { joinEndpoint } from "./types";
