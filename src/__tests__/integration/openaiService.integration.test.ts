import {openaiService} from '../../services/openaiService';
import {contentFilterService} from '../../services/contentFilterService';
import {
  DialogueRequest,
  DialogueResponse,
  CharacterPersonality,
  ConversationContext,
} from '../../types/Dialogue';

// Mock dependencies
jest.mock('../../services/contentFilterService');

const mockContentFilterService = contentFilterService as jest.Mocked<typeof contentFilterService>;

// Mock fetch for OpenAI API
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('OpenAIService Integration Tests', () => {
  const testUserId = 'test-user-123';
  
  const mockCharacterPersonality: CharacterPersonality = {
    aggressiveness: 30,
    kindness: 80,
    tsundere_level: 20,
    shyness: 60,
  };

  const mockConversationContext: ConversationContext = {
    character_id: 'aoi',
    scenario_id: 'daily_morning',
    conversation_history: [
      {
        id: '1',
        character_id: 'aoi',
        user_message: 'おはよう',
        character_response: 'おはようございます！今日もよろしくお願いします。',
        emotion: 'happy',
        timestamp: new Date('2024-07-15T09:00:00Z'),
        scenario_context: {
          location: 'home',
          time_of_day: 'morning',
          weather: 'sunny',
          relationship_context: 'friendly',
        },
      },
    ],
    current_emotion: 'neutral',
    relationship_level: 'friend',
    time_of_day: 'morning',
    location: 'home',
    previous_topics: ['greeting', 'daily_plans'],
  };

  const mockDialogueRequest: DialogueRequest = {
    userId: testUserId,
    userMessage: 'どんな一日を過ごそうか？',
    characterId: 'aoi',
    personality: mockCharacterPersonality,
    conversationContext: mockConversationContext,
    scenarioId: 'daily_morning',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock content filter service
    mockContentFilterService.scanContent.mockResolvedValue({
      isApproved: true,
      confidence: 0.95,
      detectedIssues: [],
      suggestedAlternatives: [],
      processingTime: 150,
    });

    // Mock successful OpenAI API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'そうですね！今日は天気も良いし、一緒にお散歩でもしませんか？君と過ごす時間はいつも楽しいです。',
            },
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 50,
          total_tokens: 200,
        },
      }),
    } as Response);
  });

  describe('Dialogue Generation', () => {
    it('should generate dialogue successfully with content filtering', async () => {
      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response).toMatchObject({
        message: expect.any(String),
        emotion: expect.stringMatching(/^(happy|sad|angry|embarrassed|surprised|neutral)$/),
        confidence: expect.any(Number),
        processingTime: expect.any(Number),
        characterId: 'aoi',
        scenarioId: 'daily_morning',
        isFiltered: false,
      });
      
      expect(mockContentFilterService.scanContent).toHaveBeenCalledWith(
        mockDialogueRequest.userMessage,
        {
          characterId: 'aoi',
          scenarioId: 'daily_morning',
          userId: testUserId,
        }
      );
    });

    it('should handle content filter rejection', async () => {
      mockContentFilterService.scanContent.mockResolvedValue({
        isApproved: false,
        confidence: 0.98,
        detectedIssues: ['inappropriate_content'],
        suggestedAlternatives: ['適切な内容に修正してください'],
        processingTime: 120,
      });

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response).toMatchObject({
        message: expect.stringContaining('申し訳ございません'),
        emotion: 'neutral',
        isFiltered: true,
      });
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should include conversation history in API request', async () => {
      await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
          body: expect.stringContaining('conversation_history'),
        })
      );
    });

    it('should adapt to character personality', async () => {
      const shyCharacterRequest = {
        ...mockDialogueRequest,
        characterId: 'aoi' as const,
        personality: {
          ...mockCharacterPersonality,
          shyness: 90,
          tsundere_level: 70,
        },
      };

      await openaiService.generateDialogue(shyCharacterRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('shyness: 90');
      expect(requestBody.messages[0].content).toContain('tsundere_level: 70');
    });

    it('should handle different scenarios appropriately', async () => {
      const romanceScenarioRequest = {
        ...mockDialogueRequest,
        scenarioId: 'romance_date',
        conversationContext: {
          ...mockConversationContext,
          scenario_id: 'romance_date',
          relationship_level: 'romantic_interest',
        },
      };

      await openaiService.generateDialogue(romanceScenarioRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('romance_date');
      expect(requestBody.messages[0].content).toContain('romantic_interest');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response).toMatchObject({
        message: expect.stringContaining('申し訳ございません'),
        emotion: 'neutral',
        confidence: 0,
        error: expect.objectContaining({
          type: 'api_error',
          message: expect.any(String),
        }),
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response).toMatchObject({
        message: expect.stringContaining('通信エラー'),
        emotion: 'neutral',
        confidence: 0,
        error: expect.objectContaining({
          type: 'network_error',
        }),
      });
    });

    it('should handle content filter service errors', async () => {
      mockContentFilterService.scanContent.mockRejectedValue(new Error('Filter service error'));

      // Should still proceed with generation when filter fails
      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response.message).toBeTruthy();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [], // Empty choices array
        }),
      } as Response);

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response).toMatchObject({
        message: expect.stringContaining('申し訳ございません'),
        emotion: 'neutral',
        confidence: 0,
        error: expect.objectContaining({
          type: 'api_error',
        }),
      });
    });

    it('should handle API rate limiting with retry logic', async () => {
      // First call fails with rate limit
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({'Retry-After': '1'}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: 'すみません、少し待ってくださいね。',
                },
              },
            ],
          }),
        } as Response);

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response.message).toBe('すみません、少し待ってくださいね。');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Optimization', () => {
    it('should track processing time', async () => {
      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response.processingTime).toBeGreaterThan(0);
      expect(response.processingTime).toBeLessThan(10000); // Should be reasonable
    });

    it('should limit conversation history length', async () => {
      const longHistoryRequest = {
        ...mockDialogueRequest,
        conversationContext: {
          ...mockConversationContext,
          conversation_history: Array(50).fill(null).map((_, index) => ({
            id: `${index}`,
            character_id: 'aoi' as const,
            user_message: `Message ${index}`,
            character_response: `Response ${index}`,
            emotion: 'neutral' as const,
            timestamp: new Date(),
            scenario_context: {
              location: 'home',
              time_of_day: 'morning',
              weather: 'sunny',
              relationship_context: 'friendly',
            },
          })),
        },
      };

      await openaiService.generateDialogue(longHistoryRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      // Should limit conversation history to prevent token overflow
      const historyInPrompt = requestBody.messages[0].content;
      const messageCount = (historyInPrompt.match(/user_message/g) || []).length;
      expect(messageCount).toBeLessThanOrEqual(10); // Should limit to last 10 messages
    });

    it('should handle concurrent requests appropriately', async () => {
      const requests = Array(5).fill(null).map(() => 
        openaiService.generateDialogue(mockDialogueRequest)
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(5);
      expect(responses.every(r => r.message)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Character-Specific Behavior', () => {
    it('should generate appropriate responses for Aoi character', async () => {
      const aoiRequest = {
        ...mockDialogueRequest,
        characterId: 'aoi' as const,
      };

      await openaiService.generateDialogue(aoiRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('蒼（Aoi）');
      expect(requestBody.messages[0].content).toContain('22歳');
    });

    it('should generate appropriate responses for Shun character', async () => {
      const shunRequest = {
        ...mockDialogueRequest,
        characterId: 'shun' as const,
        conversationContext: {
          ...mockConversationContext,
          character_id: 'shun',
        },
      };

      await openaiService.generateDialogue(shunRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('瞬（Shun）');
      expect(requestBody.messages[0].content).toContain('35歳');
    });

    it('should adapt tone based on relationship level', async () => {
      const romanticRequest = {
        ...mockDialogueRequest,
        conversationContext: {
          ...mockConversationContext,
          relationship_level: 'romantic_partner',
        },
      };

      await openaiService.generateDialogue(romanticRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('romantic_partner');
    });
  });

  describe('Context and Memory Management', () => {
    it('should maintain context across conversations', async () => {
      const contextRequest = {
        ...mockDialogueRequest,
        conversationContext: {
          ...mockConversationContext,
          previous_topics: ['work', 'hobbies', 'favorite_food'],
        },
      };

      await openaiService.generateDialogue(contextRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('previous_topics');
      expect(requestBody.messages[0].content).toContain('work');
      expect(requestBody.messages[0].content).toContain('hobbies');
    });

    it('should consider time and location context', async () => {
      const contextRequest = {
        ...mockDialogueRequest,
        conversationContext: {
          ...mockConversationContext,
          time_of_day: 'evening',
          location: 'office',
        },
      };

      await openaiService.generateDialogue(contextRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('evening');
      expect(requestBody.messages[0].content).toContain('office');
    });

    it('should track emotional state progression', async () => {
      const emotionalRequest = {
        ...mockDialogueRequest,
        conversationContext: {
          ...mockConversationContext,
          current_emotion: 'embarrassed',
        },
      };

      await openaiService.generateDialogue(emotionalRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('current_emotion');
      expect(requestBody.messages[0].content).toContain('embarrassed');
    });
  });

  describe('Response Quality and Consistency', () => {
    it('should generate responses with appropriate emotion detection', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'え、えっと...そんなこと言われると恥ずかしいです...',
              },
            },
          ],
        }),
      } as Response);

      const response = await openaiService.generateDialogue(mockDialogueRequest);
      
      expect(response.emotion).toBe('embarrassed');
    });

    it('should generate contextually appropriate responses', async () => {
      const workScenarioRequest = {
        ...mockDialogueRequest,
        scenarioId: 'work_project',
        conversationContext: {
          ...mockConversationContext,
          scenario_id: 'work_project',
          location: 'office',
        },
      };

      await openaiService.generateDialogue(workScenarioRequest);
      
      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit)?.body as string
      );
      
      expect(requestBody.messages[0].content).toContain('work_project');
      expect(requestBody.messages[0].content).toContain('professional');
    });

    it('should maintain character consistency across multiple requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await openaiService.generateDialogue({
          ...mockDialogueRequest,
          userMessage: `Message ${i}`,
        });
        responses.push(response);
      }
      
      expect(responses.every(r => r.characterId === 'aoi')).toBe(true);
      expect(responses.every(r => r.scenarioId === 'daily_morning')).toBe(true);
    });
  });
});