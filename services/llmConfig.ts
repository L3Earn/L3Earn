/**
 * LLM 设置与密钥管理（BYOK：Bring Your Own Key）。
 *
 * 安全模型（与 GitHub Pages 纯静态托管匹配）：
 * - 构建产物里不含任何密钥；key 由用户在「设置 → AI 引擎」里填写。
 * - key 默认只写 sessionStorage（关掉标签页即失效）；
 *   用户显式勾选「记住此 key」才落 localStorage。
 * - 端点、模型等非敏感设置始终存 localStorage。
 * - public/config.js 可预置默认端点/模型（不含 key），便于自托管方统一配置。
 *
 * 注意：key 存在于浏览器就意味着同源脚本（含 XSS、恶意扩展）可读取。
 * UI 会明确提示用户使用低额度专用 key。
 */

import { getPreset, DEFAULT_PRESET_ID } from "./llm/presets";
import type { LlmConnection, LlmProtocol, LlmSettings } from "./llm/types";

// 设置页需要预设列表/查询能力，这里统一从一个入口导出，避免 UI 直接依赖内部目录结构
export { LLM_PRESETS, getPreset, DEFAULT_PRESET_ID } from "./llm/presets";
export type { LlmPreset } from "./llm/presets";
export type { LlmProtocol, LlmSettings, LlmConnection } from "./llm/types";

const SETTINGS_KEY = "l2earn.llm.settings.v1";
const SECRET_KEY = "l2earn.llm.key.v1";

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  presetId: DEFAULT_PRESET_ID,
  protocol: getPreset(DEFAULT_PRESET_ID).protocol,
  baseUrl: getPreset(DEFAULT_PRESET_ID).baseUrl,
  model: getPreset(DEFAULT_PRESET_ID).defaultModel,
  temperature: 0.7,
  timeoutMs: 60_000,
  maxRetries: 1,
  rememberKey: false,
};

/** storage 在隐私模式 / SSR / 测试环境下可能不可用，一律降级为内存 */
const memoryStore = new Map<string, string>();

const getStore = (kind: "local" | "session"): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    const store = kind === "local" ? window.localStorage : window.sessionStorage;
    // 触发一次读写，确认真的可用（Safari 隐私模式会抛异常）
    const probe = "__l2earn_probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
};

const readRaw = (kind: "local" | "session", key: string): string | null => {
  const store = getStore(kind);
  if (store) {
    try {
      return store.getItem(key);
    } catch {
      /* fallthrough */
    }
  }
  return memoryStore.get(`${kind}:${key}`) ?? null;
};

const writeRaw = (
  kind: "local" | "session",
  key: string,
  value: string | null,
) => {
  const store = getStore(kind);
  if (store) {
    try {
      if (value === null) store.removeItem(key);
      else store.setItem(key, value);
    } catch {
      /* fallthrough */
    }
  }
  const scoped = `${kind}:${key}`;
  if (value === null) memoryStore.delete(scoped);
  else memoryStore.set(scoped, value);
};

const clampNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

/** 运行时默认值（public/config.js 注入），不含密钥 */
export const readRuntimeDefaults = (): Partial<LlmSettings> => {
  if (typeof window === "undefined") return {};
  const raw = window.__L2EARN_CONFIG__?.llm;
  if (!raw || typeof raw !== "object") return {};
  const result: Partial<LlmSettings> = {};
  if (typeof raw.presetId === "string") result.presetId = raw.presetId;
  if (raw.protocol === "openai" || raw.protocol === "anthropic") {
    result.protocol = raw.protocol;
  }
  if (typeof raw.baseUrl === "string") result.baseUrl = raw.baseUrl;
  if (typeof raw.chatPath === "string") result.chatPath = raw.chatPath;
  if (typeof raw.model === "string") result.model = raw.model;
  if (raw.temperature !== undefined) {
    result.temperature = clampNumber(raw.temperature, 0.7, 0, 2);
  }
  if (raw.maxTokens !== undefined) {
    result.maxTokens = clampNumber(raw.maxTokens, 4096, 1, 200_000);
  }
  if (raw.timeoutMs !== undefined) {
    result.timeoutMs = clampNumber(raw.timeoutMs, 60_000, 1_000, 600_000);
  }
  if (raw.maxRetries !== undefined) {
    result.maxRetries = clampNumber(raw.maxRetries, 1, 0, 5);
  }
  return result;
};

const normalizeSettings = (input: Partial<LlmSettings>): LlmSettings => {
  const preset = getPreset(input.presetId ?? DEFAULT_LLM_SETTINGS.presetId);
  const protocol: LlmProtocol =
    input.protocol === "openai" || input.protocol === "anthropic"
      ? input.protocol
      : preset.protocol;
  return {
    presetId: input.presetId ?? DEFAULT_LLM_SETTINGS.presetId,
    protocol,
    baseUrl: (input.baseUrl ?? preset.baseUrl).trim(),
    chatPath: input.chatPath,
    model: (input.model ?? preset.defaultModel).trim(),
    temperature: clampNumber(
      input.temperature,
      DEFAULT_LLM_SETTINGS.temperature,
      0,
      2,
    ),
    maxTokens:
      input.maxTokens === undefined
        ? undefined
        : clampNumber(input.maxTokens, 4096, 1, 200_000),
    timeoutMs: clampNumber(
      input.timeoutMs,
      DEFAULT_LLM_SETTINGS.timeoutMs,
      1_000,
      600_000,
    ),
    maxRetries: clampNumber(
      input.maxRetries,
      DEFAULT_LLM_SETTINGS.maxRetries,
      0,
      5,
    ),
    rememberKey: Boolean(input.rememberKey),
  };
};

export const loadLlmSettings = (): LlmSettings => {
  const runtime = readRuntimeDefaults();
  const stored = readRaw("local", SETTINGS_KEY);
  let parsed: Partial<LlmSettings> = {};
  if (stored) {
    try {
      parsed = JSON.parse(stored) as Partial<LlmSettings>;
    } catch {
      parsed = {};
    }
  }
  return normalizeSettings({ ...DEFAULT_LLM_SETTINGS, ...runtime, ...parsed });
};

export const saveLlmSettings = (settings: LlmSettings): LlmSettings => {
  const normalized = normalizeSettings(settings);
  const { rememberKey, ...persisted } = normalized;
  writeRaw("local", SETTINGS_KEY, JSON.stringify(persisted));
  // 非持久化模式：把 key 从 localStorage 清走，避免「取消勾选后仍残留」
  if (!rememberKey) writeRaw("local", SECRET_KEY, null);
  else writeRaw("session", SECRET_KEY, null);
  return normalized;
};

export const loadApiKey = (): string =>
  readRaw("local", SECRET_KEY) ?? readRaw("session", SECRET_KEY) ?? "";

export const saveApiKey = (apiKey: string, remember: boolean): void => {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    clearApiKey();
    return;
  }
  writeRaw(remember ? "local" : "session", SECRET_KEY, trimmed);
  writeRaw(remember ? "session" : "local", SECRET_KEY, null);
};

export const clearApiKey = (): void => {
  writeRaw("local", SECRET_KEY, null);
  writeRaw("session", SECRET_KEY, null);
};

/** UI 展示用：只露头尾，避免截图/录屏泄露整串 key */
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey) return "";
  if (apiKey.length <= 8) return "•".repeat(apiKey.length);
  return `${apiKey.slice(0, 4)}${"•".repeat(Math.min(12, apiKey.length - 8))}${apiKey.slice(-4)}`;
};

/** 按协议推导默认接口路径 */
export const defaultChatPath = (protocol: LlmProtocol): string =>
  protocol === "anthropic" ? "/v1/messages" : "/chat/completions";

/**
 * 把设置 + 密钥解析成一次可用的连接。
 * 纯函数、不碰网络，方便单测。
 */
export const resolveConnection = (
  settings: LlmSettings,
  apiKey: string,
): LlmConnection => {
  const preset = getPreset(settings.presetId);
  const baseUrl = (settings.baseUrl || preset.baseUrl).trim().replace(/\/+$/, "");
  const chatPath =
    settings.chatPath?.trim() ||
    preset.chatPath ||
    defaultChatPath(settings.protocol);
  return {
    protocol: settings.protocol,
    baseUrl,
    chatPath,
    apiKey: apiKey.trim(),
    model: settings.model.trim() || preset.defaultModel,
  };
};

export interface LlmConfigReadiness {
  ready: boolean;
  problems: string[];
}

/** 判断当前配置是否可用，用于 UI 提示与提前拦截 */
export const checkReadiness = (
  settings: LlmSettings,
  apiKey: string,
): LlmConfigReadiness => {
  const preset = getPreset(settings.presetId);
  const problems: string[] = [];
  if (!settings.baseUrl.trim()) problems.push("请填写服务地址（baseUrl）");
  if (!settings.model.trim()) problems.push("请填写模型名（model）");
  if (preset.requiresKey && !apiKey.trim()) problems.push("请填写 API key");
  return { ready: problems.length === 0, problems };
};

/** 当前生效配置摘要（供 UI 展示，绝不返回明文 key） */
export const describeLlmSettings = (settings: LlmSettings, apiKey: string) => ({
  preset: getPreset(settings.presetId).label,
  protocol: settings.protocol,
  baseUrl: settings.baseUrl,
  model: settings.model,
  apiKey: maskApiKey(apiKey),
  hasKey: Boolean(apiKey),
  rememberKey: settings.rememberKey,
});
