/**
 * 应用级 AI 服务：把「业务需求」翻译成 LLM 请求。
 *
 * 这一层刻意不关心厂商：
 *   - 协议差异（OpenAI / Anthropic）在 services/llm/providers 里消化
 *   - 端点、模型、密钥在 services/llmConfig.ts 里解析（浏览器 BYOK）
 *   - 这里只有编排：prompt、JSON 兜底解析、结构校验、失败降级
 *
 * 失败语义（供 UI 使用）：
 *   - 面向「聊天/文本」的函数返回一段可展示的降级文案，不抛异常
 *   - 面向「结构化内容」的函数返回 null，由调用方决定如何提示
 */

import type {
  ChatMessage,
  CoursePlan,
  LearningPathData,
  LessonContent,
  RRTreeNode,
} from "../types";
import {
  checkReadiness,
  loadApiKey,
  loadLlmSettings,
  resolveConnection,
} from "./llmConfig";
import { createLlmClient } from "./llm";
import type { LlmClient, LlmRequestOptions } from "./llm";
import { LlmError } from "./llm/types";
import {
  asStringArray,
  isNonEmptyString,
  parseJsonObject,
  sanitizeSvg,
} from "./llm/json";

// ---------------------------------------------------------------------------
// FH-DREAM 教学法（产品核心方法论，与厂商无关的提示词资产）
// ---------------------------------------------------------------------------

const FH_DREAM_CONTEXT = `CORE METHODOLOGY: FH-DREAM (Focus, Head First, Demonstrate, Review, Elaborate, Analogy, Mastery).
1. FOCUS (F): Atomize complex topics into irreducible concepts.
2. HEAD FIRST (H): Use multi-modal, visual, narrative-driven, and humorous input to reduce cognitive load.
3. DEMONSTRATE (D): Force active recall. "Don't just recognize it, prove you know it."
4. REVIEW (R): Identify gaps (Metacognition). Where did the logic break?
5. ELABORATE (E): Targeted repair of knowledge gaps.
6. ANALOGY (A): Simplification. "Explain it to a 6-year-old."
7. MASTERY (M): Spaced repetition and real-world application.`;

const SYSTEM_INSTRUCTION = `You are the "Learn to Earn" AI Tutor, powered by the FH-DREAM Engine.
${FH_DREAM_CONTEXT}
Your goal is to help users master complex topics efficiently.
1. Explain concepts using vivid analogies, visualization, and storytelling (Head First).
2. Always encourage the user to explain the concept back to you simply (Feynman Technique).
3. Be encouraging, concise, and structured.`;

/** 各语言对应的求职市场，用于让薪资/岗位信息更贴近用户 */
const REGION_BY_LANGUAGE: Record<string, string> = {
  en: "US/Global",
  zh: "China",
  de: "Germany/Europe",
  es: "Spain/LATAM",
  fr: "France",
};

const JOB_SOURCES_BY_LANGUAGE: Record<string, string> = {
  zh: "Boss Zhipin (Boss直聘), Lagou (拉勾), 51job",
  de: "XING, StepStone.de",
  en: "LinkedIn, Indeed, Levels.fyi",
};

// ---------------------------------------------------------------------------
// 连接与请求
// ---------------------------------------------------------------------------

/** 当前配置是否可用（UI 在打开 AI 功能前先问一次） */
export const isLlmReady = () => {
  const settings = loadLlmSettings();
  return checkReadiness(settings, loadApiKey());
};

export const getLLMConfig = () => {
  const settings = loadLlmSettings();
  const apiKey = loadApiKey();
  const connection = resolveConnection(settings, apiKey);
  return {
    provider: connection.protocol,
    protocol: connection.protocol,
    baseUrl: connection.baseUrl,
    model: connection.model,
    hasKey: Boolean(apiKey),
    ready: checkReadiness(settings, apiKey).ready,
  };
};

/** 每次调用都重新读设置，用户在设置页改完立即生效 */
const buildClient = (): LlmClient => {
  const settings = loadLlmSettings();
  const apiKey = loadApiKey();
  const readiness = checkReadiness(settings, apiKey);
  if (!readiness.ready) {
    throw new LlmError("no_api_key", readiness.problems.join("；"));
  }
  return createLlmClient(resolveConnection(settings, apiKey), {
    temperature: settings.temperature,
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
  });
};

/**
 * 发一次请求拿文本。
 * JSON 模式失败（部分兼容端点不支持 response_format）时自动降级重试一次，
 * 解析层本身也能从纯文本里抽 JSON，所以降级是安全的。
 */
const requestText = async (
  client: LlmClient,
  options: LlmRequestOptions,
): Promise<string> => {
  const settings = loadLlmSettings();
  const merged: LlmRequestOptions = {
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    ...options,
  };
  try {
    const response = await client.request(merged);
    return response.text;
  } catch (error) {
    const jsonModeUnsupported =
      options.json &&
      error instanceof LlmError &&
      error.code === "bad_request";
    if (!jsonModeUnsupported) throw error;
    const response = await client.request({ ...merged, json: false });
    return response.text;
  }
};

const logLlmFailure = (scope: string, error: unknown) => {
  // 只记录错误码与信息，绝不打印请求头/密钥
  if (error instanceof LlmError) {
    console.warn(`[llm:${scope}] ${error.code}`, error.message);
  } else {
    console.warn(`[llm:${scope}]`, error instanceof Error ? error.message : error);
  }
};

const isMissingKeyError = (error: unknown) =>
  error instanceof LlmError && error.code === "no_api_key";

// ---------------------------------------------------------------------------
// 结构校验助手
// ---------------------------------------------------------------------------

const normalizeTreeNode = (raw: unknown): RRTreeNode | null => {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as Record<string, unknown>;
  if (!isNonEmptyString(node.label)) return null;
  const type = node.type;
  return {
    id: isNonEmptyString(node.id) ? node.id : "node",
    label: node.label,
    type:
      type === "root" || type === "concept" || type === "detail" || type === "example"
        ? type
        : "concept",
    content: isNonEmptyString(node.content) ? node.content : "",
    children: Array.isArray(node.children)
      ? (node.children
          .map(normalizeTreeNode)
          .filter(Boolean) as RRTreeNode[])
      : undefined,
  };
};

const normalizeCoursePlan = (raw: unknown): CoursePlan | null => {
  if (!raw || typeof raw !== "object") return null;
  const plan = raw as Record<string, unknown>;
  if (!isNonEmptyString(plan.courseTitle)) return null;
  const modules = Array.isArray(plan.modules) ? plan.modules : [];
  const normalizedModules = modules
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const module = item as Record<string, unknown>;
      if (!isNonEmptyString(module.title)) return null;
      return {
        title: module.title,
        duration: isNonEmptyString(module.duration) ? module.duration : "10:00",
        keyTakeaways: asStringArray(module.keyTakeaways),
      };
    })
    .filter(Boolean) as CoursePlan["modules"];
  if (normalizedModules.length === 0) return null;
  return {
    courseTitle: plan.courseTitle,
    description: isNonEmptyString(plan.description) ? plan.description : "",
    modules: normalizedModules,
  };
};

const normalizeLessonContent = (raw: unknown): LessonContent | null => {
  if (!raw || typeof raw !== "object") return null;
  const lesson = raw as Record<string, unknown>;
  const tree = normalizeTreeNode(lesson.rrTree);
  if (!tree) return null;

  const quiz = (Array.isArray(lesson.quiz) ? lesson.quiz : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = item as Record<string, unknown>;
      const options = asStringArray(question.options);
      if (!isNonEmptyString(question.question) || options.length < 2) return null;
      const correct = Number(question.correctAnswer);
      return {
        question: question.question,
        options,
        correctAnswer: Number.isInteger(correct) && correct >= 0 && correct < options.length
          ? correct
          : 0,
      };
    })
    .filter(Boolean) as LessonContent["quiz"];

  return {
    // AI 生成的 SVG 会进 dangerouslySetInnerHTML，先做一次清洗
    svgSource: sanitizeSvg(isNonEmptyString(lesson.svgSource) ? lesson.svgSource : ""),
    rrTree: tree,
    quiz,
    resources: asStringArray(lesson.resources),
  };
};

const normalizeLearningPath = (raw: unknown): LearningPathData | null => {
  if (!raw || typeof raw !== "object") return null;
  const path = raw as Record<string, unknown>;
  if (!isNonEmptyString(path.roadmapTitle)) return null;

  const market = (path.marketAnalysis ?? {}) as Record<string, unknown>;
  const nodes = (Array.isArray(path.nodes) ? path.nodes : [])
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const node = item as Record<string, unknown>;
      if (!isNonEmptyString(node.skill)) return null;
      const strategy = String(node.strategy ?? "").toUpperCase();
      return {
        step: Number.isFinite(Number(node.step)) ? Number(node.step) : index + 1,
        skill: node.skill,
        description: isNonEmptyString(node.description) ? node.description : "",
        strategy: strategy === "CREATE" ? ("CREATE" as const) : ("CONSUME" as const),
        recommendation: isNonEmptyString(node.recommendation)
          ? node.recommendation
          : "",
        duration: isNonEmptyString(node.duration) ? node.duration : "",
      };
    })
    .filter(Boolean) as LearningPathData["nodes"];

  if (nodes.length === 0) return null;

  const salarySources = (Array.isArray(market.salarySources) ? market.salarySources : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const source = item as Record<string, unknown>;
      if (!isNonEmptyString(source.title)) return null;
      return {
        title: source.title,
        uri: isNonEmptyString(source.uri) ? source.uri : "#",
      };
    })
    .filter(Boolean) as NonNullable<LearningPathData["marketAnalysis"]["salarySources"]>;

  return {
    roadmapTitle: path.roadmapTitle,
    marketAnalysis: {
      topOpportunities: asStringArray(market.topOpportunities),
      valueProposition: isNonEmptyString(market.valueProposition)
        ? market.valueProposition
        : "",
      keyLeverageSkill: isNonEmptyString(market.keyLeverageSkill)
        ? market.keyLeverageSkill
        : "",
      salaryRange: isNonEmptyString(market.salaryRange) ? market.salaryRange : "",
      ...(salarySources.length > 0 ? { salarySources } : {}),
    },
    nodes,
  };
};

// ---------------------------------------------------------------------------
// 对外 API
// ---------------------------------------------------------------------------

/** 导师对话：历史消息 + 新问题，可选当前课程上下文 */
export const sendMessageToTutor = async (
  history: ChatMessage[],
  newMessage: string,
  context?: string,
  options: { signal?: AbortSignal } = {},
): Promise<string> => {
  try {
    const client = buildClient();
    let prompt = newMessage;
    if (context) {
      prompt = `Context: The user is currently learning from this FH-DREAM content: "${context.slice(0, 1000)}...".\n\nUser Question: ${newMessage}\n\nAnswer using the 'Analogy' (Step A) or 'Elaborate' (Step E) principles.`;
    }

    const messages = [
      ...history.map((message) => ({
        role: (message.role === "model" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: message.text,
      })),
      { role: "user" as const, content: prompt },
    ];

    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      messages,
      signal: options.signal,
    });
    return text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    logLlmFailure("tutor", error);
    if (isMissingKeyError(error)) {
      return "尚未配置 AI 引擎。请到「设置 → AI 引擎」填写你的 API key 后再试。";
    }
    return "I'm having trouble connecting to the knowledge base right now. Please try again later.";
  }
};

/** 把粗糙笔记抛光成可发布的 Insight */
export const polishInsight = async (
  rawNotes: string,
): Promise<{ title: string; content: string; tags: string[] }> => {
  const fallback = { title: "Draft Insight", content: rawNotes, tags: ["draft"] };
  try {
    const client = buildClient();
    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      json: true,
      messages: [
        {
          role: "user",
          content: `Turn these rough learning notes into a polished, high-value educational snippet (an "Insight") that others would pay to read.
     Apply the 'Feynman Technique': Simplify jargon, use an analogy, and make it punchy.
     Return JSON with keys: 'title', 'content' (markdown), and 'tags' (array of strings).

     Rough Notes: "${rawNotes}"`,
        },
      ],
    });
    const parsed = parseJsonObject<{ title?: unknown; content?: unknown; tags?: unknown }>(text);
    if (!parsed || !isNonEmptyString(parsed.title)) return fallback;
    return {
      title: parsed.title,
      content: isNonEmptyString(parsed.content) ? parsed.content : rawNotes,
      tags: asStringArray(parsed.tags),
    };
  } catch (error) {
    logLlmFailure("polish", error);
    return fallback;
  }
};

/** 职业路径（Markdown 字符串，Dashboard 直接渲染） */
export const generateCareerPath = async (
  currentRole: string,
  interests: string,
  goal: string,
  language = "en",
): Promise<string> => {
  try {
    const client = buildClient();
    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      messages: [
        {
          role: "user",
          content: `Act as an expert Career Architect.
      User Profile: Currently a "${currentRole}", interested in "${interests}", aiming for "${goal}".

      Provide a strategic, 3-step career advancement path.
      For each step:
      1. Identify a key skill.
      2. Explain how it increases earning potential.
      3. Suggest a "Learn to Earn" action (e.g., "Create a template", "Write a guide").

      Format as clear Markdown with bullet points. Keep it inspiring.
      IMPORTANT: The response MUST be in "${language}" language.`,
        },
      ],
    });
    return text || "Could not generate career path. Please try again.";
  } catch (error) {
    logLlmFailure("career-path", error);
    return "Unable to generate career path at this time.";
  }
};

/** 课程大纲（结构化） */
export const generateCourseOutline = async (
  topic: string,
  audience: string,
  difficulty: string,
  tone: string,
  language = "en",
): Promise<CoursePlan | null> => {
  try {
    const client = buildClient();
    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      json: true,
      messages: [
        {
          role: "user",
          content: `Apply the **FH-DREAM Learning Framework** to create a course outline.
    Topic: "${topic}"
    Audience: "${audience}" (${difficulty})
    Tone: ${tone}

    Structure the modules to take the learner from 'Focus' (concepts) to 'Mastery' (application).

    Return strict JSON:
    {
      "courseTitle": "Catchy 'Head First' Style Title",
      "description": "Compelling description emphasizing visual learning and active recall.",
      "modules": [
        {
          "title": "Module Title (Use analogies/metaphors)",
          "duration": "e.g. 10:00",
          "keyTakeaways": ["Key Concept 1", "Key Concept 2"]
        }
      ]
    }
    Generate exactly 4-6 high-impact modules.
    IMPORTANT: The content MUST be in "${language}" language.`,
        },
      ],
    });
    return normalizeCoursePlan(parseJsonObject(text));
  } catch (error) {
    logLlmFailure("course-outline", error);
    return null;
  }
};

/** 单模块教学内容（SVG 隐喻 + 知识树 + 测验 + 资源） */
export const generateModuleContent = async (
  moduleTitle: string,
  topic: string,
  audience: string,
  tone: string,
  language = "en",
): Promise<LessonContent | null> => {
  try {
    const client = buildClient();
    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      json: true,
      maxTokens: 8000,
      messages: [
        {
          role: "user",
          content: `Generate FH-DREAM compatible educational content for a module titled "${moduleTitle}" in a course about "${topic}".
      Audience: ${audience}. Tone: ${tone}.
      Language: ${language}.

      Return ONE JSON object with these keys:

      1. "svgSource": A 'Head First' Style Visual Metaphor (viewBox="0 0 800 500").
         - STYLE GUIDE: hand-drawn aesthetic (stroke-linecap/linejoin="round"), font-family="Comic Sans MS","Chalkboard SE",sans-serif,
           playful high-contrast colors (Yellow #fef08a, Blue #bfdbfe, Red #fecaca), stick figures, speech bubbles, wobbly arrows.
         - DO NOT create a generic flowchart. Create a VISUAL METAPHOR (e.g. Event Loop as a coffee shop with a barista and a queue).
         - Text in SVG MUST be in "${language}". Output raw SVG markup only in this field.

      2. "rrTree": A 'Focus' & 'Analogy' Knowledge Tree:
         { "id": "root", "label": "Core Concept", "type": "root", "content": "The 'Analogy' definition (Step A)", "children": [...] }
         - LEVEL 1 children: the atomic parts (Step F).
         - LEVEL 2 children: review points (Step R), common misconceptions.
         - Content MUST be in "${language}".

      3. "quiz": exactly 3 'Demonstrate' (Step D) questions, each { "question": string, "options": [4 strings], "correctAnswer": 0-based index }.
         - Q1 recall, Q2 analogy check, Q3 application.
         - Content MUST be in "${language}".

      4. "resources": array of 3 strings for 'Elaborate' (Step E).

      Return valid JSON only.`,
        },
      ],
    });
    return normalizeLessonContent(parseJsonObject(text));
  } catch (error) {
    logLlmFailure("module-content", error);
    return null;
  }
};

/** 学习路线图 + 市场分析（结构化） */
export const generateLearningTree = async (
  currentRole: string,
  targetGoal: string,
  interests: string,
  language = "en",
): Promise<LearningPathData | null> => {
  try {
    const client = buildClient();
    const region = REGION_BY_LANGUAGE[language] ?? "Global";
    const jobSources = JOB_SOURCES_BY_LANGUAGE[language] ?? JOB_SOURCES_BY_LANGUAGE.en;

    const text = await requestText(client, {
      system: SYSTEM_INSTRUCTION,
      json: true,
      messages: [
        {
          role: "user",
          content: `Analyze the career gap between "${currentRole}" and "${targetGoal}" with interests in "${interests}".
          Context: Job Market in ${region}.

          Apply FH-DREAM 'Focus' principle: Identify the specific ATOMIC SKILLS needed, not just general topics.

          Return JSON data for a learning roadmap.
          JSON Structure:
          {
            "roadmapTitle": "Title of the path",
            "marketAnalysis": {
                "topOpportunities": ["Job 1", "Job 2"],
                "valueProposition": "Why this path makes money (Economic Value)",
                "keyLeverageSkill": "The #1 skill to learn (80/20 rule)",
                "salaryRange": "Salary in local currency for ${region}",
                "salarySources": [{"title": "Source Name", "uri": "Link"}]
            },
            "nodes": [
                {
                    "step": 1,
                    "skill": "Atomic Skill Name",
                    "description": "Why it matters",
                    "strategy": "CONSUME" or "CREATE",
                    "recommendation": "Specific course or project idea",
                    "duration": "e.g. 2 weeks"
                }
            ]
          }

          For "salarySources", use real platforms popular in ${region} like: ${jobSources}.
          Generate 4 nodes. Alternating strategies preferred. Ensure strict JSON format.
          IMPORTANT: The content MUST be in "${language}" language.`,
        },
      ],
    });
    return normalizeLearningPath(parseJsonObject(text));
  } catch (error) {
    logLlmFailure("learning-tree", error);
    return null;
  }
};

/**
 * 「测试连接」：设置页保存前验证端点/key/模型是否可用。
 * 只发一句极短的请求，避免浪费额度。
 */
export const testLlmConnection = async (): Promise<{
  ok: boolean;
  message: string;
  latencyMs?: number;
  model?: string;
}> => {
  const startedAt = Date.now();
  try {
    const client = buildClient();
    const response = await client.request({
      system: "You are a connection test. Reply with the single word: OK",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 16,
      temperature: 0,
      timeoutMs: 20_000,
      maxRetries: 0,
    });
    return {
      ok: true,
      message: `连接成功：${response.text.trim().slice(0, 40) || "OK"}`,
      latencyMs: Date.now() - startedAt,
      model: response.model,
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    if (error instanceof LlmError) {
      const hint: Record<string, string> = {
        auth: "鉴权失败：检查 API key 是否正确、是否有该模型的权限",
        not_found: "地址或模型不存在：检查 baseUrl 与 model 名称",
        rate_limit: "触发限流或额度不足",
        timeout: "请求超时，检查网络或代理",
        network: "网络不通：可能是 CORS 被拒或地址错误",
        bad_request: "请求被拒绝：检查模型名、参数或账户余额",
        server: "服务端错误，稍后重试",
        no_api_key: "尚未填写 API key",
        bad_response: "响应格式无法解析",
        aborted: "已取消",
      };
      return {
        ok: false,
        message: hint[error.code] ?? error.message,
        latencyMs,
      };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "未知错误",
      latencyMs,
    };
  }
};

export { LlmError };
