/** @type {import('tailwindcss').Config} */
// Tailwind CSS v3 配置。注意：不要升级到 v4 —— v4 的 `@import "tailwindcss"` 指令、
// 配置方式（CSS-first）与 `bg-gradient-to-*` → `bg-linear-to-*` 等类名变更会大面积
// 破坏现有组件里的 800 多处 className。
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // 组件里大量使用 `animate-fade-in`：淡入 + 轻微上浮
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // 弹窗使用 `animate-scale-up`：淡入 + 从 96% 放大
        "scale-up": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // 渐变文字使用 `animate-gradient-x`：让 background-position 来回移动
        "gradient-x": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
            backgroundSize: "200% 200%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            backgroundSize: "200% 200%",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "scale-up": "scale-up 0.2s ease-out both",
        "gradient-x": "gradient-x 6s ease infinite",
      },
    },
  },
  plugins: [],
};
