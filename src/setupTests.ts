import "@testing-library/jest-dom";

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.ResizeObserver = mockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Supabase mock
jest.mock("../services/supabase", () => ({
  getSupabaseClient: () => null,
  isSupabaseConfigured: () => false,
  configureSupabase: () => null,
}));

// Environment variables mock (厂商无关 OpenAI 兼容配置)
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  LLM_API_KEY: "test-llm-api-key",
  LLM_BASE_URL: "https://llm-test.example.com/v1",
  LLM_MODEL: "test-model",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
};
