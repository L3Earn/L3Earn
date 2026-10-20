import type { CoursePlan, LearningPathData } from "../types";

/**
 * 演示用种子数据。
 *
 * 这些内容属于「内容资产」，不属于应用编排，因此从 App.tsx 里抽出来：
 * - 只在 Demo 模式（未配置 Supabase / 未生成真实内容）时展示
 * - 是常量，避免在每次 render 时重新构造对象
 * 真实运行时它们会被 AI 生成结果与 Supabase 数据覆盖。
 */

export const LANGUAGES = [
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "zh", label: "中文 (CN)", flag: "🇨🇳" },
  { code: "de", label: "Deutsch (DE)", flag: "🇩🇪" },
  { code: "es", label: "Español (ES)", flag: "🇪🇸" },
  { code: "fr", label: "Français (FR)", flag: "🇫🇷" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Learning Tree 视图的默认示例路线（前端 → 全栈架构师） */
export const DEMO_LEARNING_PATH: LearningPathData = {
  roadmapTitle: "Strategic Path: Frontend to Full Stack Architect",
  marketAnalysis: {
    topOpportunities: [
      "Senior Full Stack Engineer",
      "Technical Lead",
      "Solutions Architect",
    ],
    valueProposition:
      "Bridge the gap between UI and Data. Full stack architects control the entire product lifecycle, commanding top-tier equity and salary.",
    keyLeverageSkill: "System Design & Cloud Architecture",
    salaryRange: "$130k - $210k",
    salarySources: [
      { title: "Levels.fyi", uri: "#" },
      { title: "Glassdoor", uri: "#" },
    ],
  },
  nodes: [
    {
      step: 1,
      skill: "Server-Side Rendering (Next.js)",
      description:
        "Move beyond SPA. Learn how hydration and edge computing work to improve performance and SEO.",
      strategy: "CONSUME",
      recommendation: "Advanced Next.js Patterns Course",
      duration: "3 weeks",
    },
    {
      step: 2,
      skill: "Database Design (SQL & NoSQL)",
      description:
        "Data is the core of value. Understand normalization, indexing, and eventual consistency.",
      strategy: "CREATE",
      recommendation: "Build a multi-tenant SaaS schema",
      duration: "4 weeks",
    },
    {
      step: 3,
      skill: "Cloud Infrastructure (AWS/Docker)",
      description:
        "Code needs a home. Learn containerization and serverless patterns to deploy scalable apps.",
      strategy: "CONSUME",
      recommendation: "DevOps for Frontend Devs",
      duration: "3 weeks",
    },
    {
      step: 4,
      skill: "System Design Architecture",
      description:
        "The glue that holds it all together. Load balancing, caching strategies, and CAP theorem.",
      strategy: "CREATE",
      recommendation: "Design a clone of Uber's backend",
      duration: "5 weeks",
    },
  ],
};

/** Creator Studio 视图的默认示例大纲（CSS Grid） */
export const DEMO_COURSE_PLAN: CoursePlan = {
  courseTitle: "Mastering CSS Grid Layouts",
  description:
    "A comprehensive guide to building complex, responsive 2D layouts on the web without framework bloat.",
  modules: [
    {
      title: "Grid Fundamentals & Syntax",
      duration: "15:00",
      keyTakeaways: ["Display grid", "Fr units", "Implicit vs Explicit grids"],
    },
    {
      title: "Placing Items & Grid Areas",
      duration: "20:00",
      keyTakeaways: ["Grid lines", "Named areas", "Z-index in grid"],
    },
    {
      title: "Responsive Patterns without Media Queries",
      duration: "18:30",
      keyTakeaways: ["Auto-fit vs Auto-fill", "Minmax function", "Clamp()"],
    },
    {
      title: "Real-world Layout Project",
      duration: "45:00",
      keyTakeaways: ["Bento box layout", "Dashboard grid", "Fallbacks"],
    },
  ],
};
