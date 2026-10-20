import {
  clearLlmLogs,
  getLlmLogs,
  recordLlmLog,
  subscribeLlmLogs,
} from '../../../services/llm/diagnostics';
import { createLlmClient } from '../../../services/llm';
import type { LlmConnection } from '../../../services/llm/types';

const entry = (id: string) => ({
  id,
  startedAt: Date.now(),
  durationMs: 10,
  protocol: 'openai' as const,
  model: 'gpt-test',
  url: 'https://example.com/v1/chat/completions',
  jsonMode: false,
  ok: true,
});

describe('LLM 诊断日志', () => {
  beforeEach(() => {
    clearLlmLogs();
  });

  it('最新的日志排在最前，且有条数上限', () => {
    for (let i = 0; i < 60; i += 1) recordLlmLog(entry(`req-${i}`));
    const logs = getLlmLogs();
    expect(logs).toHaveLength(50);
    expect(logs[0].id).toBe('req-59');
  });

  it('订阅者会收到变更通知，退订后不再收到', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLlmLogs(listener);
    recordLlmLog(entry('req-a'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    recordLlmLog(entry('req-b'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('清空后长度归零', () => {
    recordLlmLog(entry('req-a'));
    clearLlmLogs();
    expect(getLlmLogs()).toHaveLength(0);
  });

  it('客户端请求成功时记录协议/模型/耗时/用量，且不记录密钥', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          model: 'gpt-test',
          choices: [{ message: { content: 'hello' } }],
          usage: { prompt_tokens: 3, completion_tokens: 4 },
        }),
    });

    const connection: LlmConnection = {
      protocol: 'openai',
      baseUrl: 'https://example.com/v1',
      chatPath: '/chat/completions',
      apiKey: 'sk-secret-value',
      model: 'gpt-test',
    };
    await createLlmClient(connection).request({
      messages: [{ role: 'user', content: 'hi' }],
    });

    const [log] = getLlmLogs();
    expect(log.ok).toBe(true);
    expect(log.model).toBe('gpt-test');
    expect(log.usage).toEqual({ inputTokens: 3, outputTokens: 4 });
    expect(JSON.stringify(log)).not.toContain('sk-secret-value');
  });

  it('客户端请求失败时记录错误码而不抛日志异常', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'bad key' } }),
    });

    const connection: LlmConnection = {
      protocol: 'openai',
      baseUrl: 'https://example.com/v1',
      chatPath: '/chat/completions',
      apiKey: 'sk-secret-value',
      model: 'gpt-test',
    };

    await expect(
      createLlmClient(connection, { maxRetries: 0 }).request({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toMatchObject({ code: 'auth' });

    const [log] = getLlmLogs();
    expect(log.ok).toBe(false);
    expect(log.status).toBe(401);
    expect(log.errorCode).toBe('auth');
    expect(JSON.stringify(log)).not.toContain('sk-secret-value');
  });
});
