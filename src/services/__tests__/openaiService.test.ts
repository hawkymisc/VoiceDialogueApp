import {openaiService} from '../openaiService';
import {DialogueRequest, DialogueResponse} from '../openaiService';

// Mock OpenAI client
jest.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = {
      completions: {
        create: jest.fn(),
      },
    };
  },
}));

describe('OpenAI Service', () => {
  const mockRequest: DialogueRequest = {
    characterId: 'aoi',
    userMessage: 'こんにちは',
    conversationHistory: [],
    scenario: '朝の挨拶',
  };

  const mockOpenAIResponse = {
    choices: [
      {
        message: {
          content: 'こんにちは！今日も素敵な一日になりそうですね。',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInitializationStatus', () => {
    it('should return initialization status', () => {
      const result = openaiService.getInitializationStatus();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateDialogue', () => {
    beforeEach(() => {
      // Mock the client being initialized
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
      (openaiService as any).client = mockClient;
      (openaiService as any).isInitialized = true;
    });

    it('should generate dialogue response', async () => {
      const mockClient = (openaiService as any).client;
      mockClient.chat.completions.create
        .mockResolvedValueOnce(mockOpenAIResponse) // First call for dialogue
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  primaryEmotion: 'happy',
                  emotions: {
                    neutral: 0.1,
                    happy: 0.8,
                    sad: 0.0,
                    angry: 0.0,
                    surprised: 0.1,
                    embarrassed: 0.0,
                  },
                  confidence: 0.9,
                }),
              },
            },
          ],
        }); // Second call for emotion analysis

      const result = await openaiService.generateDialogue(mockRequest);

      expect(result).toEqual({
        text: 'こんにちは！今日も素敵な一日になりそうですね。',
        emotion: 'happy',
        confidence: 0.9,
        usage: undefined,
      });
    });

    it('should handle empty response', async () => {
      const mockClient = (openaiService as any).client;
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      await expect(openaiService.generateDialogue(mockRequest)).rejects.toThrow(
        'Dialogue generation failed: No response generated'
      );
    });

    it('should handle API error', async () => {
      const mockClient = (openaiService as any).client;
      mockClient.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(openaiService.generateDialogue(mockRequest)).rejects.toThrow('Dialogue generation failed: API Error');
    });

    it('should throw error when not initialized', async () => {
      // Set service as not initialized
      (openaiService as any).isInitialized = false;
      
      await expect(openaiService.generateDialogue(mockRequest)).rejects.toThrow(
        'OpenAI service not initialized'
      );
    });
  });

  describe('analyzeEmotion', () => {
    beforeEach(() => {
      // Mock the client being initialized
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
      (openaiService as any).client = mockClient;
      (openaiService as any).isInitialized = true;
    });

    it('should analyze emotion from text', async () => {
      const mockClient = (openaiService as any).client;
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: JSON.stringify({
              primaryEmotion: 'happy',
              emotions: {
                neutral: 0.1,
                happy: 0.8,
                sad: 0.0,
                angry: 0.0,
                surprised: 0.1,
                embarrassed: 0.0,
              },
              confidence: 0.9,
            })
          } 
        }],
      });

      const result = await openaiService.analyzeEmotion('嬉しいです！');

      expect(result).toEqual({
        primaryEmotion: 'happy',
        emotions: {
          neutral: 0.1,
          happy: 0.8,
          sad: 0.0,
          angry: 0.0,
          surprised: 0.1,
          embarrassed: 0.0,
        },
        confidence: 0.9,
      });
    });

    it('should return neutral for unknown emotion', async () => {
      const mockClient = (openaiService as any).client;
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }],
      });

      const result = await openaiService.analyzeEmotion('不明な感情');

      expect(result).toEqual({
        primaryEmotion: 'neutral',
        emotions: {
          neutral: 1.0,
          happy: 0.0,
          sad: 0.0,
          angry: 0.0,
          surprised: 0.0,
          embarrassed: 0.0,
        },
        confidence: 0.5,
      });
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build system prompt for aoi', () => {
      const prompt = (openaiService as any).buildSystemPrompt(mockRequest);
      
      expect(prompt).toContain('22歳の美青年「蒼」');
      expect(prompt).toContain('朝の挨拶');
    });

    it('should build system prompt for shun', () => {
      const request = { ...mockRequest, characterId: 'shun' as const };
      const prompt = (openaiService as any).buildSystemPrompt(request);
      
      expect(prompt).toContain('35歳の大人の男性「瞬」');
    });

    it('should include relationship context', () => {
      const request = { ...mockRequest, relationshipContext: '先輩後輩' };
      const prompt = (openaiService as any).buildSystemPrompt(request);
      
      expect(prompt).toContain('先輩後輩');
    });
  });

  describe('buildMessageHistory', () => {
    it('should build message history with system prompt', () => {
      const conversationHistory = [
        {
          id: '1',
          text: 'こんにちは',
          sender: 'user' as const,
          timestamp: Date.now(),
          emotion: 'neutral' as const,
        },
        {
          id: '2',
          text: 'こんにちは！',
          sender: 'character' as const,
          timestamp: Date.now(),
          emotion: 'happy' as const,
        },
      ];

      const request = { ...mockRequest, conversationHistory };
      const systemPrompt = 'System prompt';
      const messages = (openaiService as any).buildMessageHistory(request, systemPrompt);

      expect(messages).toHaveLength(4); // system + 2 history + current user
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[2].role).toBe('assistant');
      expect(messages[3].role).toBe('user');
    });

    it('should limit message history', () => {
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        text: `メッセージ ${i}`,
        sender: (i % 2 === 0 ? 'user' : 'character') as const,
        timestamp: Date.now(),
        emotion: 'neutral' as const,
      }));

      const request = { ...mockRequest, conversationHistory: longHistory };
      const systemPrompt = 'System prompt';
      const messages = (openaiService as any).buildMessageHistory(request, systemPrompt);

      // Should include system prompt + limited history + current user message
      expect(messages.length).toBeLessThanOrEqual(22); // 1 system + 20 history + 1 current
    });
  });
});