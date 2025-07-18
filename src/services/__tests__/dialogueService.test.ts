import {dialogueService} from '../dialogueService';
import {CharacterType} from '../../types/Character';
import {DialogueScenario} from '../../types/Dialogue';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('dialogueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate a response for a given message', async () => {
      const mockResponse = {
        text: 'こんにちは！元気ですか？',
        emotion: 'happy',
        audioUrl: 'https://example.com/audio.mp3',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await dialogueService.generateResponse({
        message: 'こんにちは',
        characterId: 'aoi',
        scenario: {
          id: 'daily',
          category: 'daily',
          title: 'Daily Chat',
          description: 'Normal conversation',
          initialPrompt: 'Hello',
          tags: ['casual'],
          difficulty: 'easy',
        },
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dialogue/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('こんにちは'),
        })
      );
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        dialogueService.generateResponse({
          message: 'Hello',
          characterId: 'aoi',
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
        })
      ).rejects.toThrow('Failed to generate response: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        dialogueService.generateResponse({
          message: 'Hello',
          characterId: 'aoi',
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
        })
      ).rejects.toThrow('Network error');
    });

    it('should include character context in request', async () => {
      const mockResponse = {
        text: 'Test response',
        emotion: 'neutral',
        audioUrl: 'https://example.com/audio.mp3',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await dialogueService.generateResponse({
        message: 'Test message',
        characterId: 'shun',
        scenario: {
          id: 'work',
          category: 'work',
          title: 'Work Chat',
          description: 'Work conversation',
          initialPrompt: 'Good morning',
          tags: ['work'],
          difficulty: 'medium',
        },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dialogue/generate'),
        expect.objectContaining({
          body: expect.stringContaining('shun'),
        })
      );
    });
  });

  describe('getScenarios', () => {
    it('should fetch available scenarios', async () => {
      const mockScenarios = [
        {
          id: 'daily',
          category: 'daily',
          title: 'Daily Chat',
          description: 'Normal conversation',
          initialPrompt: 'Hello',
          tags: ['casual'],
          difficulty: 'easy',
        },
        {
          id: 'work',
          category: 'work',
          title: 'Work Chat',
          description: 'Work conversation',
          initialPrompt: 'Good morning',
          tags: ['work'],
          difficulty: 'medium',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockScenarios,
      });

      const result = await dialogueService.getScenarios();

      expect(result).toEqual(mockScenarios);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scenarios'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle scenarios fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(dialogueService.getScenarios()).rejects.toThrow(
        'Failed to fetch scenarios: 404 Not Found'
      );
    });
  });

  describe('getScenariosByCategory', () => {
    it('should fetch scenarios by category', async () => {
      const mockScenarios = [
        {
          id: 'daily_morning',
          category: 'daily',
          title: 'Morning Chat',
          description: 'Morning conversation',
          initialPrompt: 'Good morning',
          tags: ['casual', 'morning'],
          difficulty: 'easy',
        },
        {
          id: 'daily_evening',
          category: 'daily',
          title: 'Evening Chat',
          description: 'Evening conversation',
          initialPrompt: 'Good evening',
          tags: ['casual', 'evening'],
          difficulty: 'easy',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockScenarios,
      });

      const result = await dialogueService.getScenariosByCategory('daily');

      expect(result).toEqual(mockScenarios);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scenarios/daily'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('analyzeEmotion', () => {
    it('should analyze emotion from text', async () => {
      const mockEmotionResult = {
        emotion: 'happy',
        confidence: 0.85,
        emotions: {
          happy: 0.85,
          neutral: 0.10,
          sad: 0.05,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmotionResult,
      });

      const result = await dialogueService.analyzeEmotion('I am so happy today!');

      expect(result).toEqual(mockEmotionResult);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/emotion/analyze'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('I am so happy today!'),
        })
      );
    });

    it('should handle emotion analysis errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        dialogueService.analyzeEmotion('Test text')
      ).rejects.toThrow('Failed to analyze emotion: 400 Bad Request');
    });
  });

  describe('saveDialogue', () => {
    it('should save dialogue to server', async () => {
      const mockDialogue = {
        id: 'dialogue-123',
        characterId: 'aoi' as CharacterType,
        scenario: {
          id: 'daily',
          category: 'daily',
          title: 'Daily Chat',
          description: 'Normal conversation',
          initialPrompt: 'Hello',
          tags: ['casual'],
          difficulty: 'easy',
        },
        messages: [
          {
            id: 'msg-1',
            text: 'Hello',
            sender: 'user',
            timestamp: Date.now(),
            emotion: 'neutral',
          },
          {
            id: 'msg-2',
            text: 'Hi there!',
            sender: 'character',
            timestamp: Date.now() + 1000,
            emotion: 'happy',
          },
        ],
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        emotionProgression: ['neutral', 'happy'],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({success: true}),
      });

      const result = await dialogueService.saveDialogue(mockDialogue);

      expect(result).toEqual({success: true});
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dialogue/save'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('dialogue-123'),
        })
      );
    });
  });

  describe('loadDialogueHistory', () => {
    it('should load dialogue history from server', async () => {
      const mockHistory = [
        {
          id: 'dialogue-1',
          characterId: 'aoi' as CharacterType,
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
          startTime: Date.now() - 120000,
          endTime: Date.now() - 60000,
          messageCount: 10,
          emotionProgression: ['neutral', 'happy'],
          rating: 5,
        },
        {
          id: 'dialogue-2',
          characterId: 'shun' as CharacterType,
          scenario: {
            id: 'work',
            category: 'work',
            title: 'Work Chat',
            description: 'Work conversation',
            initialPrompt: 'Good morning',
            tags: ['work'],
            difficulty: 'medium',
          },
          startTime: Date.now() - 60000,
          endTime: Date.now(),
          messageCount: 5,
          emotionProgression: ['neutral'],
          rating: 4,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await dialogueService.loadDialogueHistory();

      expect(result).toEqual(mockHistory);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dialogue/history'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should load dialogue history with pagination', async () => {
      const mockHistory = [
        {
          id: 'dialogue-1',
          characterId: 'aoi' as CharacterType,
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
          startTime: Date.now() - 120000,
          endTime: Date.now() - 60000,
          messageCount: 10,
          emotionProgression: ['neutral', 'happy'],
          rating: 5,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await dialogueService.loadDialogueHistory(0, 10);

      expect(result).toEqual(mockHistory);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dialogue/history?offset=0&limit=10'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('API configuration', () => {
    it('should use correct API base URL', () => {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://api.example.com';
      
      // This test verifies that the service uses the correct base URL
      expect(dialogueService.baseUrl).toBe(baseUrl);
    });

    it('should handle API timeout', async () => {
      // Mock a timeout scenario
      (fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(
        dialogueService.generateResponse({
          message: 'Hello',
          characterId: 'aoi',
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Malformed JSON');
        },
      });

      await expect(
        dialogueService.generateResponse({
          message: 'Hello',
          characterId: 'aoi',
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
        })
      ).rejects.toThrow('Malformed JSON');
    });

    it('should handle empty response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      await expect(
        dialogueService.generateResponse({
          message: 'Hello',
          characterId: 'aoi',
          scenario: {
            id: 'daily',
            category: 'daily',
            title: 'Daily Chat',
            description: 'Normal conversation',
            initialPrompt: 'Hello',
            tags: ['casual'],
            difficulty: 'easy',
          },
        })
      ).rejects.toThrow('Empty response from server');
    });
  });
});