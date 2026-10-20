/**
 * 运行时配置示例（可选）。
 *
 * 用法：复制为 public/config.js，然后重新构建。
 * public/ 下的文件会被原样拷贝到 dist/，因此可以在不改代码的前提下
 * 为某个自托管实例预置默认端点与模型。
 *
 * ⚠️ 这里只能放**非敏感**默认值：端点、模型、温度等。
 *    绝对不要在这里写 API key —— 构建产物是公开的。
 *    key 由每个用户在「设置 → AI 引擎」里自己填写，存浏览器本地存储。
 *
 * 生效优先级：运行时配置 < 用户自己的设置（用户在设置页保存的总是覆盖这里）。
 */
window.__L2EARN_CONFIG__ = {
  llm: {
    // 预设 id：openai | anthropic | deepseek | moonshot | minimax
    //          | openrouter | zhipu | ollama | custom
    presetId: "openai",

    // 协议：openai | anthropic（决定请求体与 endpoint）
    protocol: "openai",

    // 服务根地址（OpenAI 兼容通常以 /v1 结尾；Anthropic 是 https://api.anthropic.com）
    baseUrl: "https://api.openai.com/v1",

    // 自定义接口路径（留空则按协议取默认值）
    // chatPath: "/chat/completions",

    // 默认模型
    model: "gpt-4o-mini",

    // 采样温度 0–2
    temperature: 0.7,

    // 单次回复 token 上限（Anthropic 必填，未设时用适配器默认值 4096）
    // maxTokens: 4096,

    // 请求超时（毫秒）
    timeoutMs: 60000,

    // 网络错误重试次数（4xx 不重试）
    maxRetries: 1,
  },
};
