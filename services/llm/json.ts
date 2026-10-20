/**
 * 从模型输出里稳定地取出 JSON，并对 AI 生成的 SVG 做安全清洗。
 *
 * 为什么需要：
 * - 各厂商对「只输出 JSON」的服从度不同，常见带 ```json 围栏或前后解释文字。
 * - Anthropic 没有 response_format，更需要兜底抽取。
 * - SVG 会被 dangerouslySetInnerHTML 注入，必须在进入 DOM 前剥离脚本与事件处理器。
 */

/** 去掉 markdown 围栏，并截取第一个 { 到最后一个 } */
export const extractJsonText = (text: string): string => {
  let clean = text.trim();
  clean = clean.replace(/^```(?:json|JSON)?\s*/m, "").replace(/```\s*$/m, "");

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return clean.trim();
};

/** 解析失败返回 null，绝不抛异常（调用方按「生成失败」处理） */
export const parseJsonObject = <T>(text: string): T | null => {
  if (!text) return null;
  try {
    const parsed = JSON.parse(extractJsonText(text));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * SVG 安全清洗：
 * - 删除 <script>/<foreignObject>/<iframe> 等可执行或可嵌入内容
 * - 删除所有 on* 事件属性
 * - 删除 javascript:/data:text/html 链接
 * 这是一层防线，最终仍建议配合 CSP。
 */
export const sanitizeSvg = (svg: string): string => {
  if (!svg) return "";
  let clean = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*\/>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

  // on* 事件属性（onload=、onclick= ...）
  clean = clean.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 协议注入
  clean = clean.replace(
    /(href|xlink:href)\s*=\s*("|')\s*(javascript|data:text\/html)[^"']*\2/gi,
    '$1="#"',
  );

  return clean;
};

/**
 * 在 AI 返回的 JSON 文本被注入 DOM 之前做一次结构校验；
 * 缺失字段直接判定生成失败，避免 UI 崩在 undefined 上。
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
