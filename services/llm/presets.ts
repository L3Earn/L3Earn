import type { LlmProtocol } from "./types";

/**
 * 内置厂商预设。
 * 预设只是「填好默认值」的便利项，不是白名单：任何 OpenAI / Anthropic 兼容端点
 * 都可以通过 custom 预设或直接改 baseUrl / model 接入。
 */
export interface LlmPreset {
  id: string;
  label: string;
  protocol: LlmProtocol;
  /** 服务根地址；留空表示必须由用户填写 */
  baseUrl: string;
  /** 相对 baseUrl 的接口路径 */
  chatPath: string;
  defaultModel: string;
  models: string[];
  /** 是否必须提供 API key（本地 Ollama 之类可以没有） */
  requiresKey: boolean;
  /** 是否需要联网访问（本地服务用于 UI 提示） */
  local?: boolean;
  docsUrl?: string;
  note?: string;
}

export const LLM_PRESETS: LlmPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    protocol: "openai",
    baseUrl: "https://api.openai.com/v1",
    chatPath: "/chat/completions",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o3-mini"],
    requiresKey: true,
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    protocol: "anthropic",
    baseUrl: "https://api.anthropic.com",
    chatPath: "/v1/messages",
    defaultModel: "claude-sonnet-4-5",
    models: [
      "claude-sonnet-4-5",
      "claude-opus-4-1",
      "claude-3-7-sonnet-latest",
      "claude-3-5-haiku-latest",
    ],
    requiresKey: true,
    docsUrl: "https://console.anthropic.com/settings/keys",
    note: "浏览器直连需要 anthropic-dangerous-direct-browser-access 头（本应用会自动带上）。",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    chatPath: "/chat/completions",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    requiresKey: true,
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "moonshot",
    label: "Moonshot (Kimi)",
    protocol: "openai",
    baseUrl: "https://api.moonshot.cn/v1",
    chatPath: "/chat/completions",
    defaultModel: "moonshot-v1-8k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "kimi-k2-0905-preview"],
    requiresKey: true,
    docsUrl: "https://platform.moonshot.cn/console/api-keys",
  },
  {
    id: "minimax",
    label: "MiniMax",
    protocol: "openai",
    baseUrl: "https://api.minimaxi.com/v1",
    chatPath: "/chat/completions",
    defaultModel: "MiniMax-M2.5",
    models: ["MiniMax-M2.5", "MiniMax-Text-01"],
    requiresKey: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter（一个 key 用多家模型）",
    protocol: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    chatPath: "/chat/completions",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "deepseek/deepseek-chat",
      "google/gemini-2.0-flash-001",
    ],
    requiresKey: true,
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "zhipu",
    label: "智谱 GLM",
    protocol: "openai",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    chatPath: "/chat/completions",
    defaultModel: "glm-4-flash",
    models: ["glm-4-plus", "glm-4-flash", "glm-4-air"],
    requiresKey: true,
    docsUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  {
    id: "ollama",
    label: "Ollama（本地）",
    protocol: "openai",
    baseUrl: "http://localhost:11434/v1",
    chatPath: "/chat/completions",
    defaultModel: "llama3.1",
    models: ["llama3.1", "qwen2.5", "mistral"],
    requiresKey: false,
    local: true,
    note: "本地服务无需 key；若部署在 GitHub Pages（https）访问 http://localhost 会被浏览器拦截混合内容。",
  },
  {
    id: "custom",
    label: "自定义 / 自托管",
    protocol: "openai",
    baseUrl: "",
    chatPath: "/chat/completions",
    defaultModel: "",
    models: [],
    requiresKey: true,
    note: "任意 OpenAI 兼容端点，例如 vLLM、LM Studio、自建网关。",
  },
];

export const DEFAULT_PRESET_ID = "openai";

export const getPreset = (id: string): LlmPreset =>
  LLM_PRESETS.find((p) => p.id === id) ??
  LLM_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
