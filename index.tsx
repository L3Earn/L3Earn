import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { configureSupabase } from './services/supabase';
import { configureRuntimeInfo } from './services/runtimeInfo';

/**
 * 入口层是唯一读取构建期环境变量的地方：
 * - 只有 VITE_ 前缀的变量会被 Vite 注入（见 vite-env.d.ts）
 * - AI 的端点/模型/密钥不在这里：那是运行时 BYOK 配置（设置页填写）
 * - Supabase 为可选后端；未配置时 configureSupabase 返回 null，应用走 Demo 模式
 */
configureSupabase(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

configureRuntimeInfo({
  baseUrl: import.meta.env.BASE_URL,
  mode: import.meta.env.DEV ? 'dev' : 'prod',
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
