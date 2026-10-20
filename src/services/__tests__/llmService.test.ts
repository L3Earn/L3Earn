import {
  generateCareerPath,
  generateCourseOutline,
  generateLearningTree,
  generateModuleContent,
  getLLMConfig,
  polishInsight,
  sendMessageToTutor,
} from '../../../services/llmService';
import {
  DEFAULT_LLM_SETTINGS,
  resolveConnection,
  saveApiKey,
  saveLlmSettings,
} from '../../../services/llmConfig';
import {
  extractJsonText,
  parseJsonObject,
  sanitizeSvg,
} from '../../../services/llm/json';
import type { LlmSettings } from '../../../services/llm/types';

/**
 * 这些测试验证「骨架」而不是实现细节：
 * - 两种协议的请求形状 / 鉴权头 / 响应解析
 * - BYOK 配置解析与就绪判断
 * - JSON 抽取与 SVG 清洗（AI 输出进入 DOM 前的安全边界）
 * - 失败时的降级契约（UI 依赖它）
 */

const ok = (payload: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(payload),
});

const fail = (status: number, payload: unknown) => ({
  ok: false,
  status,
  text: async () => JSON.stringify(payload),
});

const openaiReply = (content: string) =>
  ok({
    model: 'gpt-test',
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 10, completion_tokens: 20 },
  });

const anthropicReply = (text: string) =>
  ok({
    model: 'claude-test',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 10, output_tokens: 20 },
  });

const useOpenAi = (settings: Partial<LlmSettings> = {}) => {
  saveLlmSettings({ ...DEFAULT_LLM_SETTINGS, ...settings });
  saveApiKey('sk-test-key', false);
};

const useAnthropic = () => {
  saveLlmSettings({
    ...DEFAULT_LLM_SETTINGS,
    presetId: 'anthropic',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    chatPath: '/v1/messages',
    model: 'claude-sonnet-4-5',
  });
  saveApiKey('anthropic-test-key', false);
};

describe('LLM 骨架', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    global.fetch = jest.fn();
  });

  describe('配置解析（BYOK）', () => {
    it('OpenAI 预设解析出 chat/completions 端点', () => {
      const connection = resolveConnection(DEFAULT_LLM_SETTINGS, 'sk-test-key');
      expect(connection.protocol).toBe('openai');
      expect(connection.baseUrl).toBe('https://api.openai.com/v1');
      expect(connection.chatPath).toBe('/chat/completions');
    });

    it('Anthropic 预设解析出 /v1/messages', () => {
      const connection = resolveConnection(
        {
          ...DEFAULT_LLM_SETTINGS,
          presetId: 'anthropic',
          protocol: 'anthropic',
          baseUrl: 'https://api.anthropic.com',
          chatPath: '/v1/messages',
          model: 'claude-sonnet-4-5',
        },
        'k',
      );
      expect(connection.chatPath).toBe('/v1/messages');
      expect(connection.protocol).toBe('anthropic');
    });

    it('未配置 key 时就绪状态为 false', () => {
      saveLlmSettings(DEFAULT_LLM_SETTINGS);
      saveApiKey('', false);
      const config = getLLMConfig();
      expect(config.ready).toBe(false);
      expect(config.hasKey).toBe(false);
    });
  });

  describe('OpenAI 协议', () => {
    beforeEach(useOpenAi);

    it('发送 Bearer 鉴权与标准消息体', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(openaiReply('你好，这是回答'));

      const result = await sendMessageToTutor([], '解释 React Hooks');

      expect(result).toBe('你好，这是回答');
      const [url, init] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(init.headers.Authorization).toBe('Bearer sk-test-key');
      const body = JSON.parse(init.body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toEqual(
        expect.arrayContaining([
          { role: 'user', content: '解释 React Hooks' },
        ]),
      );
    });

    it('历史消息的 model 角色映射为 assistant', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(openaiReply('ok'));

      await sendMessageToTutor(
        [
          { id: '1', role: 'user', text: 'Q1', timestamp: new Date() },
          { id: '2', role: 'model', text: 'A1', timestamp: new Date() },
        ],
        'Q2',
      );

      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages).toEqual(
        expect.arrayContaining([
          { role: 'user', content: 'Q1' },
          { role: 'assistant', content: 'A1' },
        ]),
      );
    });

    it('鉴权失败时返回可展示的降级文案而不是抛错', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(
        fail(401, { error: { message: 'invalid api key' } }),
      );

      const result = await sendMessageToTutor([], 'hi');

      expect(result).toContain('trouble connecting');
    });
  });

  describe('Anthropic 协议', () => {
    beforeEach(useAnthropic);

    it('使用 x-api-key、顶层 system 与 /v1/messages', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(
        anthropicReply('回答来自 Claude'),
      );

      const result = await sendMessageToTutor([], '解释闭包');

      expect(result).toBe('回答来自 Claude');
      const [url, init] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init.headers['x-api-key']).toBe('anthropic-test-key');
      expect(init.headers['anthropic-version']).toBe('2023-06-01');
      // 浏览器直连必需，否则 CORS 预检会被拒
      expect(
        init.headers['anthropic-dangerous-direct-browser-access'],
      ).toBe('true');
      expect(init.headers.Authorization).toBeUndefined();

      const body = JSON.parse(init.body);
      expect(body.system).toBeTruthy();
      expect(body.max_tokens).toBeGreaterThan(0);
      // system 不能出现在 messages 里
      expect(
        body.messages.every((m: { role: string }) => m.role !== 'system'),
      ).toBe(true);
    });
  });

  describe('结构化生成', () => {
    beforeEach(useOpenAi);

    it('从带 markdown 围栏的响应里抽出课程大纲', async () => {
      const plan = {
        courseTitle: 'Hooks 深潜',
        description: '视觉化理解',
        modules: [
          { title: 'M1', duration: '10:00', keyTakeaways: ['a'] },
          { title: 'M2', duration: '12:00', keyTakeaways: ['b'] },
        ],
      };
      (fetch as jest.Mock).mockResolvedValueOnce(
        openaiReply('```json\n' + JSON.stringify(plan) + '\n```'),
      );

      const result = await generateCourseOutline(
        'React',
        'Dev',
        'Beginner',
        'Fun',
      );

      expect(result?.courseTitle).toBe('Hooks 深潜');
      expect(result?.modules).toHaveLength(2);
    });

    it('结构不合法时返回 null（UI 按生成失败处理）', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(openaiReply('这不是 JSON'));
      await expect(
        generateCourseOutline('React', 'Dev', 'Beginner', 'Fun'),
      ).resolves.toBeNull();
    });

    it('模块内容会清洗 SVG 里的脚本与事件处理器', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(
        openaiReply(
          JSON.stringify({
            svgSource:
              '<svg onload="alert(1)"><script>alert(2)</script><text>ok</text></svg>',
            rrTree: {
              id: 'root',
              label: 'Root',
              type: 'root',
              content: 'c',
              children: [],
            },
            quiz: [{ question: 'Q', options: ['A', 'B'], correctAnswer: 1 }],
            resources: ['r1'],
          }),
        ),
      );

      const result = await generateModuleContent('M1', 'React', 'Dev', 'Fun');

      expect(result?.svgSource).not.toContain('<script');
      expect(result?.svgSource).not.toContain('onload');
      expect(result?.svgSource).toContain('<text>ok</text>');
      expect(result?.quiz[0].correctAnswer).toBe(1);
    });

    it('学习树会规范化 strategy 与节点', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(
        openaiReply(
          JSON.stringify({
            roadmapTitle: '前端到全栈',
            marketAnalysis: {
              topOpportunities: ['Full Stack'],
              valueProposition: 'v',
              keyLeverageSkill: 'System Design',
              salaryRange: '$100k',
            },
            nodes: [
              {
                step: 1,
                skill: 'Next.js',
                description: 'd',
                strategy: 'create',
                recommendation: 'r',
                duration: '2w',
              },
            ],
          }),
        ),
      );

      const result = await generateLearningTree('FE', 'FS', 'cloud');

      expect(result?.nodes[0].strategy).toBe('CREATE');
      expect(result?.marketAnalysis.keyLeverageSkill).toBe('System Design');
    });

    it('职业路径失败时返回降级文案', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));
      await expect(generateCareerPath('a', 'b', 'c')).resolves.toBe(
        'Unable to generate career path at this time.',
      );
    });

    it('Insight 解析失败时回退为草稿', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(openaiReply('不是 JSON'));
      const result = await polishInsight('原始笔记');
      expect(result.title).toBe('Draft Insight');
      expect(result.content).toBe('原始笔记');
    });
  });

  describe('未配置密钥时的行为', () => {
    it('对话直接提示去设置里填写 key', async () => {
      saveLlmSettings(DEFAULT_LLM_SETTINGS);
      saveApiKey('', false);

      const result = await sendMessageToTutor([], 'hi');

      expect(result).toContain('AI 引擎');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('JSON 与 SVG 工具', () => {
    it('extractJsonText 去掉围栏并截取对象', () => {
      expect(extractJsonText('前言 ```json\n{"a":1}\n``` 后记')).toBe('{"a":1}');
    });

    it('parseJsonObject 对非法输入返回 null', () => {
      expect(parseJsonObject('not json')).toBeNull();
      expect(parseJsonObject('{"ok":true}')).toEqual({ ok: true });
    });

    it('sanitizeSvg 移除 javascript: 链接', () => {
      const cleaned = sanitizeSvg(
        '<svg><a href="javascript:alert(1)">x</a></svg>',
      );
      expect(cleaned).not.toContain('javascript:');
    });
  });
});
