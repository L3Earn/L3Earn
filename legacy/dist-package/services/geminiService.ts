/**
 * @deprecated This file is kept for backward compatibility.
 * Please import from './llmService' instead.
 *
 * This module now uses a generic LLM client supporting OpenAI-compatible APIs.
 * Configure via environment variables:
 * - LLM_PROVIDER: 'openai' | 'anthropic' | 'azure' | 'custom'
 * - LLM_API_KEY: Your API key
 * - LLM_MODEL: Model name (default: 'MiniMax-M2.5')
 * - LLM_BASE_URL: Custom base URL (optional)
 */

// Re-export everything from llmService for backward compatibility
export {
  sendMessageToTutor,
  polishInsight,
  generateCareerPath,
  generateCourseOutline,
  generateModuleContent,
  generateLearningTree,
  getLLMConfig,
  llmClient,
  LLMClient,
} from "./llmService";
