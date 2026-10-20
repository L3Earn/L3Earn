import { LlmError } from "./types";

/**
 * 协议无关的 HTTP 传输层：超时、重试、错误归一化。
 * 只做网络与错误映射，不关心是 OpenAI 还是 Anthropic 的 body 结构。
 */

export interface TransportOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const RETRY_BASE_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 把 HTTP 状态码映射成稳定的错误码，供 UI 给出可操作提示 */
const codeForStatus = (status: number) => {
  if (status === 401 || status === 403) return "auth" as const;
  if (status === 404) return "not_found" as const;
  if (status === 408) return "timeout" as const;
  if (status === 429) return "rate_limit" as const;
  if (status >= 500) return "server" as const;
  return "bad_request" as const;
};

const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

/** 尽量从各家错误体里抽出可读信息（OpenAI: error.message；Anthropic: error.message） */
export const readErrorMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const body = payload as Record<string, unknown>;
  const err = body.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const message = (err as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  const message = body.message;
  if (typeof message === "string") return message;
  return undefined;
};

const parseJsonSafely = (text: string): unknown => {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export interface HttpResult {
  status: number;
  body: unknown;
}

/**
 * 发送 JSON POST。仅对网络错误、超时与可重试状态码重试；
 * 4xx（鉴权/参数错误）不重试，避免把用户 key 反复打到风控上。
 */
export const postJson = async (
  url: string,
  headers: Record<string, string>,
  payload: unknown,
  options: TransportOptions = {},
): Promise<HttpResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = Math.max(0, options.maxRetries ?? 0);

  let attempt = 0;
  for (;;) {
    if (options.signal?.aborted) {
      throw new LlmError("aborted", "请求已取消", { retryable: false });
    }

    // 把外部取消信号与本地超时合成一个
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await response.text();
      const body = parseJsonSafely(text);

      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < maxRetries) {
          attempt += 1;
          await sleep(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }
        throw new LlmError(
          codeForStatus(response.status),
          readErrorMessage(body) ?? `LLM 服务返回 ${response.status}`,
          { status: response.status, retryable: isRetryableStatus(response.status) },
        );
      }

      return { status: response.status, body };
    } catch (error) {
      if (error instanceof LlmError) throw error;
      if (timedOut) {
        if (attempt < maxRetries) {
          attempt += 1;
          await sleep(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }
        throw new LlmError("timeout", `请求超时（${timeoutMs}ms）`, {
          retryable: true,
        });
      }
      if (options.signal?.aborted) {
        throw new LlmError("aborted", "请求已取消", { retryable: false });
      }
      // 典型情况：CORS 被拦、DNS 失败、离线
      if (attempt < maxRetries) {
        attempt += 1;
        await sleep(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      throw new LlmError(
        "network",
        "网络请求失败：请检查端点地址、网络连接与 CORS 设置",
        {
          retryable: true,
          detail: error instanceof Error ? error.message : String(error),
        },
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }
  }
};
