import React, { useEffect, useState } from 'react';
import {
  X,
  Bug,
  RefreshCw,
  Trash2,
  PlugZap,
  Copy,
  Check,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  checkReadiness,
  describeLlmSettings,
  getPreset,
  loadApiKey,
  loadLlmSettings,
  maskApiKey,
  clearApiKey,
} from '../services/llmConfig';
import type { LlmSettings } from '../services/llmConfig';
import { testLlmConnection } from '../services/llmService';
import { getRuntimeInfo } from '../services/runtimeInfo';
import {
  clearLlmLogs,
  getLlmLogs,
  subscribeLlmLogs,
} from '../services/llm/diagnostics';
import type { LlmLogEntry } from '../services/llm/diagnostics';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  /** 设置变更后通知父级刷新就绪态 */
  onLlmSettingsChange?: () => void;
}

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleTimeString('zh-CN', { hour12: false });

const formatDuration = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`);

const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
    <span className="shrink-0 text-xs text-slate-500">{label}</span>
    <span
      className={`text-right text-xs text-slate-800 break-all ${mono ? 'font-mono' : ''}`}
    >
      {value}
    </span>
  </div>
);

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onLlmSettingsChange,
}) => {
  const [settings, setSettings] = useState<LlmSettings>(() => loadLlmSettings());
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState<LlmLogEntry[]>(() => getLlmLogs());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // 打开时同步一次配置；之后订阅请求日志的增量推送
  useEffect(() => {
    if (!isOpen) return;
    setSettings(loadLlmSettings());
    setApiKey(loadApiKey());
    setLogs(getLlmLogs());
    const unsubscribe = subscribeLlmLogs(() => setLogs(getLlmLogs()));
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

  const preset = getPreset(settings.presetId);
  const readiness = checkReadiness(settings, apiKey);
  const summary = describeLlmSettings(settings, apiKey);
  const runtime = getRuntimeInfo();
  const basePath = runtime.baseUrl;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testLlmConnection();
    setTestResult({ ok: result.ok, message: result.message });
    setTesting(false);
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKey('');
    onLlmSettingsChange?.();
  };

  const handleCopyDiagnostics = async () => {
    const report = [
      `L2Earn 诊断信息 ${new Date().toISOString()}`,
      `模式: ${runtime.mode}  base: ${basePath}`,
      `预设: ${summary.preset}  协议: ${summary.protocol}`,
      `端点: ${summary.baseUrl}${settings.chatPath ?? ''}`,
      `模型: ${summary.model}`,
      `key: ${summary.apiKey || '(未设置)'}  记忆: ${settings.rememberKey}`,
      `就绪: ${readiness.ready}${readiness.problems.length ? ` (${readiness.problems.join('；')})` : ''}`,
      `温度: ${settings.temperature}  超时: ${settings.timeoutMs}ms  重试: ${settings.maxRetries}`,
      `UA: ${navigator.userAgent}`,
      `--- 最近请求 (${logs.length}) ---`,
      ...logs.slice(0, 10).map(
        (log) =>
          `${formatTime(log.startedAt)} ${log.ok ? 'OK ' : 'ERR'} ${log.protocol} ${log.model} ${formatDuration(log.durationMs)} ${log.status ?? ''} ${log.errorCode ?? ''} ${log.errorMessage ?? ''}`.trim(),
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时退化为控制台输出，方便手动复制
      console.info(report);
    }
  };

  const successCount = logs.filter((log) => log.ok).length;
  const failCount = logs.length - successCount;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose}></div>

      <aside className="relative z-10 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <Bug size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold">调试面板</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {runtime.mode === 'dev' ? 'DEV' : 'PROD'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleCopyDiagnostics}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              title="复制诊断信息"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* 引擎状态 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Cpu size={14} /> AI 引擎状态
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  readiness.ready
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {readiness.ready ? '就绪' : '未就绪'}
              </span>
            </div>

            {!readiness.ready && (
              <div className="mb-2 flex items-start space-x-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{readiness.problems.join('；')}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-1">
              <Row label="预设" value={summary.preset} />
              <Row label="协议" value={summary.protocol} mono />
              <Row label="端点" value={`${settings.baseUrl}${settings.chatPath ?? ''}`} mono />
              <Row label="模型" value={settings.model} mono />
              <Row label="API Key" value={summary.apiKey || '（未设置）'} mono />
              <Row
                label="key 存储"
                value={
                  summary.hasKey
                    ? settings.rememberKey
                      ? 'localStorage（持久）'
                      : 'sessionStorage（本标签页）'
                    : '—'
                }
              />
              <Row label="温度 / 超时" value={`${settings.temperature} / ${settings.timeoutMs}ms`} />
              <Row label="网络重试" value={`${settings.maxRetries} 次`} />
              <Row label="站点 base" value={basePath} mono />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {testing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <PlugZap size={13} />
                )}
                <span>测试连接</span>
              </button>
              <button
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <SettingsIcon size={13} />
                <span>AI 设置</span>
              </button>
              {apiKey && (
                <button
                  onClick={handleClearKey}
                  className="flex items-center space-x-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Trash2 size={13} />
                  <span>清除 key</span>
                </button>
              )}
            </div>

            {testResult && (
              <div
                className={`mt-2 flex items-start space-x-2 rounded-lg border p-2.5 text-[11px] ${
                  testResult.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                )}
                <span className="break-all">{testResult.message}</span>
              </div>
            )}
          </section>

          {/* 请求日志 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <RefreshCw size={14} /> 请求日志
              </h3>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span className="text-emerald-600">{successCount} 成功</span>
                <span className="text-rose-600">{failCount} 失败</span>
                <button
                  onClick={() => {
                    clearLlmLogs();
                    setLogs([]);
                  }}
                  className="rounded p-1 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  title="清空日志"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400">
                还没有请求。触发一次 AI 生成，或点上面的「测试连接」。
              </p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className={`rounded-xl border p-2.5 ${
                      log.ok ? 'border-slate-100 bg-white' : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center space-x-1.5 font-mono text-slate-500">
                        {log.ok ? (
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        ) : (
                          <AlertTriangle size={12} className="text-rose-600" />
                        )}
                        <span>{formatTime(log.startedAt)}</span>
                      </span>
                      <span className="text-slate-500">
                        {formatDuration(log.durationMs)}
                        {log.status !== undefined && ` · ${log.status}`}
                        {log.jsonMode && ' · JSON'}
                      </span>
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-slate-700" title={log.url}>
                      {log.protocol} · {log.model}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {log.ok
                        ? `${log.textLength ?? 0} 字符${
                            log.usage
                              ? ` · in ${log.usage.inputTokens ?? '?'} / out ${log.usage.outputTokens ?? '?'}`
                              : ''
                          }`
                        : `${log.errorCode ?? 'error'}${log.errorMessage ? `：${log.errorMessage}` : ''}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="pb-4 text-[10px] leading-relaxed text-slate-400">
            日志只保存在内存里（刷新即清空），且只记录协议/模型/耗时/状态与错误码，
            <strong>不会记录 API key 或消息内容</strong>。复制诊断信息前请注意：里面含掩码后的 key。
          </p>
        </div>
      </aside>
    </div>
  );
};
