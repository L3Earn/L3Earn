import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Bell,
  Shield,
  Moon,
  LogOut,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  PlugZap,
} from 'lucide-react';
import {
  checkReadiness,
  clearApiKey,
  defaultChatPath,
  getPreset,
  loadApiKey,
  loadLlmSettings,
  maskApiKey,
  saveApiKey,
  saveLlmSettings,
} from '../services/llmConfig';
import type { LlmSettings } from '../services/llmConfig';
import { LLM_PRESETS } from '../services/llm/presets';
import { testLlmConnection } from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
  /** AI 配置保存后通知父级刷新「是否已就绪」状态 */
  onLlmSettingsChange?: () => void;
}

type TabId = 'general' | 'notifications' | 'privacy' | 'ai';

interface TestState {
  status: 'idle' | 'testing' | 'ok' | 'fail';
  message?: string;
  latencyMs?: number;
}

const tabButtonClass = (active: boolean) =>
  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
      : 'text-slate-500 hover:bg-slate-100'
  }`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  user,
  onLlmSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // --- AI 引擎（BYOK）状态 ---
  const [llm, setLlm] = useState<LlmSettings>(() => loadLlmSettings());
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle' });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // 每次打开都从存储重新读取，避免展示过期状态
  useEffect(() => {
    if (!isOpen) return;
    setLlm(loadLlmSettings());
    setApiKey(loadApiKey());
    setTest({ status: 'idle' });
    setSavedAt(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const preset = getPreset(llm.presetId);
  const readiness = checkReadiness(llm, apiKey);

  const handlePresetChange = (presetId: string) => {
    const next = getPreset(presetId);
    setLlm((prev) => ({
      ...prev,
      presetId,
      protocol: next.protocol,
      baseUrl: next.baseUrl || prev.baseUrl,
      chatPath: next.chatPath,
      model: next.defaultModel || prev.model,
    }));
    setTest({ status: 'idle' });
  };

  const handleProtocolChange = (protocol: LlmSettings['protocol']) => {
    setLlm((prev) => ({
      ...prev,
      protocol,
      // 协议变了，接口路径必须跟着变，否则会打到错误的 endpoint
      chatPath: defaultChatPath(protocol),
    }));
    setTest({ status: 'idle' });
  };

  const persist = () => {
    const normalized = saveLlmSettings(llm);
    saveApiKey(apiKey, normalized.rememberKey);
    setLlm(normalized);
    setSavedAt(Date.now());
    onLlmSettingsChange?.();
    return normalized;
  };

  const handleSave = () => {
    persist();
  };

  const handleTest = async () => {
    // 先把当前表单写进 storage：LLM 客户端每次调用都从 storage 读配置
    persist();
    setTest({ status: 'testing' });
    const result = await testLlmConnection();
    setTest({
      status: result.ok ? 'ok' : 'fail',
      message: result.message,
      latencyMs: result.latencyMs,
    });
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKey('');
    saveLlmSettings({ ...llm, rememberKey: llm.rememberKey });
    onLlmSettingsChange?.();
    setTest({ status: 'idle' });
    setSavedAt(Date.now());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-scale-up flex flex-col md:flex-row h-[560px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Settings</h2>

          <nav className="space-y-1 flex-1">
            <button onClick={() => setActiveTab('general')} className={tabButtonClass(activeTab === 'general')}>
              <User size={18} />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={tabButtonClass(activeTab === 'ai')}
            >
              <Cpu size={18} />
              <span>AI 引擎</span>
              {!readiness.ready && (
                <span
                  className="ml-auto w-2 h-2 rounded-full bg-amber-400"
                  title="尚未配置"
                ></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={tabButtonClass(activeTab === 'notifications')}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
            <button onClick={() => setActiveTab('privacy')} className={tabButtonClass(activeTab === 'privacy')}>
              <Shield size={18} />
              <span>Privacy &amp; Security</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* ---------------- AI 引擎 ---------------- */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">AI 引擎</h3>
                <p className="text-sm text-slate-500">
                  选择厂商或填入任意 OpenAI / Anthropic 兼容端点。密钥只保存在你自己的浏览器里。
                </p>
              </div>

              {/* 就绪状态 */}
              {!readiness.ready && (
                <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    尚未可用：{readiness.problems.join('；')}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* 预设 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">服务商</label>
                  <select
                    value={llm.presetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                  >
                    {LLM_PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {preset.note && (
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{preset.note}</p>
                  )}
                </div>

                {/* 协议 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">协议</label>
                    <select
                      value={llm.protocol}
                      onChange={(e) =>
                        handleProtocolChange(e.target.value as LlmSettings['protocol'])
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="openai">OpenAI Chat Completions</option>
                      <option value="anthropic">Anthropic Messages</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">模型</label>
                    <input
                      type="text"
                      value={llm.model}
                      onChange={(e) => {
                        setLlm((prev) => ({ ...prev, model: e.target.value }));
                        setTest({ status: 'idle' });
                      }}
                      list="llm-model-options"
                      placeholder="gpt-4o-mini"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                    <datalist id="llm-model-options">
                      {[...preset.models].map((model) => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* 地址 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    服务地址（baseUrl）
                  </label>
                  <input
                    type="url"
                    value={llm.baseUrl}
                    onChange={(e) => {
                      setLlm((prev) => ({ ...prev, baseUrl: e.target.value }));
                      setTest({ status: 'idle' });
                    }}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    接口路径：<code className="font-mono">{llm.chatPath || defaultChatPath(llm.protocol)}</code>
                    ，可粘贴任意兼容端点。
                  </p>
                </div>

                {/* 密钥 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                    <KeyRound size={14} className="mr-1.5 text-slate-400" />
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setTest({ status: 'idle' });
                        }}
                        placeholder={preset.requiresKey ? 'sk-...' : '本地服务可留空'}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((value) => !value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        title={showKey ? '隐藏' : '显示'}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {apiKey && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="px-3 py-2 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <label className="mt-2 flex items-start space-x-2 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={llm.rememberKey}
                      onChange={(e) => {
                        setLlm((prev) => ({ ...prev, rememberKey: e.target.checked }));
                        setSavedAt(null);
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      记住此 key（写入 localStorage）。不勾选时只存在 sessionStorage，关掉标签页即失效。
                    </span>
                  </label>
                </div>

                {/* 高级参数 */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Temperature：{llm.temperature.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={llm.temperature}
                      onChange={(e) =>
                        setLlm((prev) => ({ ...prev, temperature: Number(e.target.value) }))
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        超时（ms）
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={llm.timeoutMs}
                        onChange={(e) =>
                          setLlm((prev) => ({ ...prev, timeoutMs: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        网络重试次数
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={llm.maxRetries}
                        onChange={(e) =>
                          setLlm((prev) => ({ ...prev, maxRetries: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 操作 */}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={test.status === 'testing'}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2 disabled:opacity-60"
                  >
                    {test.status === 'testing' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <PlugZap size={16} />
                    )}
                    <span>测试连接</span>
                  </button>
                  {savedAt && test.status === 'idle' && (
                    <span className="text-xs text-emerald-600">已保存</span>
                  )}
                </div>

                {test.status === 'ok' && (
                  <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed">
                      {test.message}
                      {test.latencyMs !== undefined && (
                        <span className="text-emerald-600">（{test.latencyMs}ms）</span>
                      )}
                    </div>
                  </div>
                )}
                {test.status === 'fail' && (
                  <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed">{test.message}</div>
                  </div>
                )}

                {/* 安全说明 */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 leading-relaxed space-y-1">
                  <p className="font-semibold text-slate-600">关于密钥安全</p>
                  <p>
                    本站是纯前端应用（GitHub Pages），没有服务器代收请求：key 由浏览器直接发往你填写的端点，
                    不会上传到本站，也不会写进构建产物。
                  </p>
                  <p>
                    但浏览器里的 key 对同源脚本（包括 XSS、恶意扩展）可见。请使用单独的低额度 key，
                    不要在公共电脑上勾选「记住此 key」。
                  </p>
                  {apiKey && (
                    <p className="font-mono text-slate-400">当前：{maskApiKey(apiKey)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Profile Information</h3>
                <p className="text-sm text-slate-500">Update your account details.</p>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl border-4 border-white shadow-sm">
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-400">JPG, GIF or PNG. 1MB Max.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Alex User"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue={user?.email || 'alex@example.com'}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                    disabled
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <Moon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Dark Mode</p>
                      <p className="text-xs text-slate-500">Reduce eye strain at night</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`text-2xl ${darkMode ? 'text-indigo-600' : 'text-slate-300'}`}
                  >
                    {darkMode ? (
                      <ToggleRight size={40} className="fill-current" />
                    ) : (
                      <ToggleLeft size={40} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Notifications</h3>
                <p className="text-sm text-slate-500">Manage how we communicate with you.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Email Digest</p>
                    <p className="text-xs text-slate-500">Weekly summary of your learning progress.</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`text-2xl ${emailNotifs ? 'text-indigo-600' : 'text-slate-300'}`}
                  >
                    {emailNotifs ? (
                      <ToggleRight size={40} className="fill-current" />
                    ) : (
                      <ToggleLeft size={40} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-700">New Course Alerts</p>
                    <p className="text-xs text-slate-500">
                      Get notified when new courses match your skills.
                    </p>
                  </div>
                  <button className="text-2xl text-indigo-600">
                    <ToggleRight size={40} className="fill-current" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Earnings Updates</p>
                    <p className="text-xs text-slate-500">Notifications when you receive payouts.</p>
                  </div>
                  <button className="text-2xl text-indigo-600">
                    <ToggleRight size={40} className="fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Privacy &amp; Security</h3>
                <p className="text-sm text-slate-500">Control your data and account security.</p>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Change Password</p>
                    <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mr-3">
                      OFF
                    </span>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-rose-600 mb-2">Danger Zone</h4>
                <button className="text-sm text-slate-500 hover:text-rose-600 underline decoration-slate-300 hover:decoration-rose-600 underline-offset-4 transition-all">
                  Delete my account and data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
