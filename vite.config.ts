import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * 解析站点部署的 base 路径（必须以 `/` 开头、以 `/` 结尾）。
 *
 * 优先级：
 *   1. `BASE_PATH` 环境变量（CI 显式传参，也方便本地验证子路径构建：
 *      `BASE_PATH=/l2earn/ pnpm build`）；
 *   2. GitHub Actions 自动推导：`GITHUB_REPOSITORY` 形如 `owner/repo`
 *      - 仓库名以 `.github.io` 结尾 → 用户/组织主页站点，部署在根路径 `/`
 *        （线上地址 https://owner.github.io/）
 *      - 其它仓库 → 项目站点，部署在 `/<repo>/` 子路径
 *        （线上地址 https://owner.github.io/<repo>/）
 *   3. 本地开发/构建默认 `/`。
 *
 * 注意：有 `base` 时，`pnpm dev` / `pnpm preview` 都在 `/<base>/` 下访问，
 * 例如 `BASE_PATH=/l2earn/ pnpm preview` → http://localhost:4173/l2earn/。
 */
const resolveBase = (): string => {
  const explicit = process.env.BASE_PATH?.trim();
  if (explicit) {
    const trimmed = explicit.replace(/^\/+|\/+$/g, "");
    return trimmed === "" ? "/" : `/${trimmed}/`;
  }

  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1]?.trim();
  if (repoName) {
    return repoName.endsWith(".github.io") ? "/" : `/${repoName}/`;
  }

  return "/";
};

/**
 * 仅开发服务器生效：移除 index.html 里的生产 CSP。
 * React Fast Refresh 需要注入内联 <script>（会被 `script-src 'self'` 拦截），
 * HMR 需要 `ws:` 连接（不在 `connect-src 'self' https:` 白名单里）。
 * 构建产物不受影响：`pnpm build` / `pnpm preview` 下 CSP 照常生效。
 */
const devStripCspPlugin = (): Plugin => ({
  name: "l2earn:strip-prod-csp-in-dev",
  apply: "serve",
  transformIndexHtml(html) {
    return html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/?>\s*/i,
      "",
    );
  },
});

/**
 * 可选运行时配置：`public/config.js`（示例见 `public/config.example.js`）。
 * index.html 里用普通 `<script src="/config.js">` 引用它，构建时 Vite 会按 base
 * 重写成 `/<base>/config.js`，public/ 下的文件原样拷进 dist/。
 * 默认的 public/config.js 是空配置，所以不会 404；部署方可替换成自己的默认端点
 * （**绝不能放 key**，构建产物是公开的）。
 */

export default defineConfig({
  // GitHub Pages 子路径部署的关键：资源 URL 会带上 BASE_PATH 前缀。
  base: resolveBase(),

  server: {
    port: 3000,
    host: "0.0.0.0",
  },

  // 注意：不再有任何 LLM 环境变量注入（define）。
  // 新的 AI 层是浏览器端 BYOK + 运行时配置，API key 只在用户浏览器里，
  // 绝不能通过构建期注入打进产物。
  plugins: [react(), devStripCspPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
