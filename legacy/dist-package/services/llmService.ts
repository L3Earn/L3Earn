import {
  ChatMessage,
  LearningPathData,
  CoursePlan,
  LessonContent,
  RRTreeNode,
} from "../types";

// LLM Provider Configuration
interface LLMConfig {
  provider: "openai" | "anthropic" | "azure" | "custom";
  apiKey: string;
  baseUrl?: string;
  model: string;
}

const llmConfig: LLMConfig = {
  provider: (process.env.LLM_PROVIDER as any) || "openai",
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
  baseUrl: process.env.LLM_BASE_URL || "https://api.minimaxi.com/v1",
  model: process.env.LLM_MODEL || "MiniMax-M2.5",
};

// FH-DREAM Methodology Context
const FH_DREAM_CONTEXT = `
CORE METHODOLOGY: FH-DREAM (Focus, Head First, Demonstrate, Review, Elaborate, Analogy, Mastery).
1. FOCUS (F): Atomize complex topics into irreducible concepts.
2. HEAD FIRST (H): Use multi-modal, visual, narrative-driven, and humorous input to reduce cognitive load.
3. DEMONSTRATE (D): Force active recall. "Don't just recognize it, prove you know it."
4. REVIEW (R): Identify gaps (Metacognition). Where did the logic break?
5. ELABORATE (E): Targeted repair of knowledge gaps.
6. ANALOGY (A): Simplification. "Explain it to a 6-year-old."
7. MASTERY (M): Spaced repetition and real-world application.
`;

// System instruction to guide the AI's behavior as a tutor
const SYSTEM_INSTRUCTION = `
You are the "Learn to Earn" AI Tutor, powered by the FH-DREAM Engine.
${FH_DREAM_CONTEXT}
Your goal is to help users master complex topics efficiently.
1. Explain concepts using vivid analogies, visualization, and storytelling (Head First).
2. Always encourage the user to explain the concept back to you simply (Feynman Technique).
3. Be encouraging, concise, and structured.
`;

const cleanJson = (text: string): string => {
  // Remove markdown code blocks
  let clean = text.replace(/```json/g, "").replace(/```/g, "");

  // Attempt to find the first '{' and last '}' to handle extra text
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  return clean.trim();
};

/**
 * Generic LLM Client supporting OpenAI-compatible APIs
 */
class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateContent(options: {
    messages?: Array<{ role: string; content: string }>;
    prompt?: string;
    systemInstruction?: string;
    responseFormat?: { type: string };
  }): Promise<{ text: string }> {
    const { messages, prompt, systemInstruction, responseFormat } = options;

    if (!this.config.apiKey) {
      throw new Error("API Key is missing. Please check your configuration.");
    }

    // Build messages array
    const requestMessages: Array<{ role: string; content: string }> = [];

    if (systemInstruction) {
      requestMessages.push({ role: "system", content: systemInstruction });
    }

    if (messages && messages.length > 0) {
      requestMessages.push(...messages);
    }

    if (prompt) {
      requestMessages.push({ role: "user", content: prompt });
    }

    // Determine API endpoint
    const baseUrl = this.config.baseUrl || this.getDefaultBaseUrl();
    const endpoint = `${baseUrl}/chat/completions`;

    // Build request body
    const requestBody: any = {
      model: this.config.model,
      messages: requestMessages,
      temperature: 0.7,
    };

    if (responseFormat?.type === "json_object") {
      requestBody.response_format = { type: "json_object" };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `LLM API Error: ${response.status} - ${errorData.error?.message || response.statusText}`,
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      return { text: content };
    } catch (error) {
      console.error("LLM API Error:", error);
      throw error;
    }
  }

  private getDefaultBaseUrl(): string {
    switch (this.config.provider) {
      case "anthropic":
        return "https://api.anthropic.com/v1";
      case "azure":
        return process.env.AZURE_OPENAI_ENDPOINT || "";
      case "custom":
        return this.config.baseUrl || "";
      case "openai":
      default:
        return "https://api.openai.com/v1";
    }
  }
}

// Initialize LLM client
const llmClient = new LLMClient(llmConfig);

export const sendMessageToTutor = async (
  history: ChatMessage[],
  newMessage: string,
  context?: string,
): Promise<string> => {
  try {
    if (!llmConfig.apiKey)
      return "API Key is missing. Please check your configuration.";

    // Construct the prompt with context if available
    let prompt = newMessage;
    if (context) {
      prompt = `Context: The user is currently learning from this FH-DREAM content: "${context.substring(0, 1000)}...".\n\nUser Question: ${newMessage}\n\nAnswer using the 'Analogy' (Step A) or 'Elaborate' (Step E) principles.`;
    }

    const messages = history.map((h) => ({
      role: h.role,
      content: h.text,
    }));

    const result = await llmClient.generateContent({
      messages,
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    return result.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("LLM API Error:", error);
    return "I'm having trouble connecting to the knowledge base right now. Please try again later.";
  }
};

export const polishInsight = async (
  rawNotes: string,
): Promise<{ title: string; content: string; tags: string[] }> => {
  try {
    if (!llmConfig.apiKey) throw new Error("No API Key");

    const prompt = `Turn these rough learning notes into a polished, high-value educational snippet (an "Insight") that others would pay to read. 
     Apply the 'Feynman Technique': Simplify jargon, use an analogy, and make it punchy.
     Return JSON with keys: 'title', 'content' (markdown), and 'tags' (array of strings).
     
     Rough Notes: "${rawNotes}"`;

    const result = await llmClient.generateContent({
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseFormat: { type: "json_object" },
    });

    const text = result.text || "{}";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Content Generation Error:", error);
    return {
      title: "Draft Insight",
      content: rawNotes,
      tags: ["draft"],
    };
  }
};

export const generateCareerPath = async (
  currentRole: string,
  interests: string,
  goal: string,
  language: string = "en",
): Promise<string> => {
  try {
    if (!llmConfig.apiKey) return "API service is unavailable (Missing Key).";

    const prompt = `
      Act as an expert Career Architect.
      User Profile: Currently a "${currentRole}", interested in "${interests}", aiming for "${goal}".
      
      Provide a strategic, 3-step career advancement path.
      For each step:
      1. Identify a key skill.
      2. Explain how it increases earning potential.
      3. Suggest a "Learn to Earn" action (e.g., "Create a template", "Write a guide").

      Format as clear Markdown with bullet points. Keep it inspiring.
      IMPORTANT: The response MUST be in "${language}" language.
    `;

    const result = await llmClient.generateContent({
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    return result.text || "Could not generate career path. Please try again.";
  } catch (error) {
    console.error("Career Path Error:", error);
    return "Unable to generate career path at this time.";
  }
};

export const generateCourseOutline = async (
  topic: string,
  audience: string,
  difficulty: string,
  tone: string,
  language: string = "en",
): Promise<CoursePlan | null> => {
  try {
    if (!llmConfig.apiKey) return null;

    const prompt = `
    Apply the **FH-DREAM Learning Framework** to create a course outline.
    Topic: "${topic}"
    Audience: "${audience}" (${difficulty})
    
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
    IMPORTANT: The content MUST be in "${language}" language.`;

    const result = await llmClient.generateContent({
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseFormat: { type: "json_object" },
    });

    const text = result.text || "{}";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Outline Generation Error:", error);
    return null;
  }
};

export const generateModuleContent = async (
  moduleTitle: string,
  topic: string,
  audience: string,
  tone: string,
  language: string = "en",
): Promise<LessonContent | null> => {
  try {
    if (!llmConfig.apiKey) return null;

    const prompt = `
      Generate FH-DREAM compatible educational content for a module titled "${moduleTitle}" in a course about "${topic}".
      Audience: ${audience}. Tone: ${tone}.
      Language: ${language}.

      I need a JSON response with THREE specific components designed for "Head First" style Deep Learning:
      
      1. "svgSource": A 'Head First' Style Visual Metaphor (viewBox="0 0 800 500").
         - **STYLE GUIDE (CRITICAL):**
           * **Hand-Drawn Aesthetic:** Use <path> with 'stroke-linecap="round"' and 'stroke-linejoin="round"' to simulate sketching. Avoid perfect rectangles.
           * **Font:** Use 'font-family="Comic Sans MS", "Chalkboard SE", sans-serif'.
           * **Colors:** Use high-contrast, playful colors (Yellow #fef08a, Blue #bfdbfe, Red #fecaca).
           * **Elements:** Stick figures, speech bubbles, arrows with wobbly lines.
         - **CONTENT:**
           * DO NOT create a generic flowchart. Create a VISUAL METAPHOR.
           * Example: If explaining "Event Loop", draw a Coffee Shop with a Barista (Stack) and a Line (Queue).
         - Text in SVG MUST be in "${language}".

      2. "rrTree": A 'Focus' & 'Analogy' Knowledge Tree (RRTreeNode).
         Structure: { "id": "root", "label": "Core Concept", "type": "root", "content": "The 'Analogy' definition (Step A)", "children": [...] }
         - LEVEL 1 Children: The 'Atomic Parts' (Step F - Focus). Break the concept into irreducible components.
         - LEVEL 2 Children: 'Review' points (Step R). Common misconceptions or "Why this is hard".
         - Content MUST be in "${language}".

      3. "quiz": Array of 3 'Demonstrate' (Step D) questions.
         - Question 1: "Recall" - Simple fact check.
         - Question 2: "Analogy Check" - "Which metaphor best explains X?"
         - Question 3: "Application" - "How would you solve this specific scenario?"
         - Content MUST be in "${language}".

      4. "resources": Array of 3 strings. Suggest resources for 'Elaborate' (Step E).

      IMPORTANT: Ensure JSON is valid.
    `;

    const result = await llmClient.generateContent({
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseFormat: { type: "json_object" },
    });

    const text = result.text || "{}";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Module Content Gen Error:", error);
    return null;
  }
};

export const generateLearningTree = async (
  currentRole: string,
  targetGoal: string,
  interests: string,
  language: string = "en",
): Promise<LearningPathData | null> => {
  try {
    if (!llmConfig.apiKey) return null;

    const regionMap: Record<string, string> = {
      en: "US/Global",
      zh: "China",
      de: "Germany/Europe",
      es: "Spain/LATAM",
      fr: "France",
    };
    const region = regionMap[language] || "Global";

    // Define job sources based on language/region
    let jobSources = "LinkedIn, Indeed";
    if (language === "zh")
      jobSources = "Boss Zhipin (Boss直聘), Lagou (拉勾), 51job";
    if (language === "de") jobSources = "XING, StepStone.de";

    const prompt = `
          Analyze the career gap between "${currentRole}" and "${targetGoal}" with interests in "${interests}".
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
          IMPORTANT: The content MUST be in "${language}" language.
        `;

    const result = await llmClient.generateContent({
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseFormat: { type: "json_object" },
    });

    const text = result.text || "{}";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Learning Tree Gen Error:", error);
    return null;
  }
};

// Export configuration for external use
export const getLLMConfig = () => ({ ...llmConfig });

// Export client for advanced use cases
export { llmClient, LLMClient };
