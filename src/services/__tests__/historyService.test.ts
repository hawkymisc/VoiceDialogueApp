import {historyService, ConversationSaveData} from '../historyService';
import {DialogueHistoryEntry, DialogueScenario} from '../../types/Dialogue';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('History Service', () => {
  const mockHistoryEntry: DialogueHistoryEntry = {
    id: 'test-dialogue-1',
    characterId: 'aoi',
    scenario: {
      id: 'daily_morning',
      category: 'daily',
      title: '朝の挨拶',
      description: '朝の何気ない会話',
      initialPrompt: '今日も一日お疲れ様です。',
      tags: ['morning', 'greeting'],
      difficulty: 'easy',
    },
    startTime: Date.now() - 300000, // 5 minutes ago
    endTime: Date.now(),
    messageCount: 5,
    emotionProgression: ['neutral', 'happy', 'surprised'],
  };

  const mockConversation: ConversationSaveData = {
    id: 'test-dialogue-1',
    characterId: 'aoi',
    scenario: mockHistoryEntry.scenario,
    messages: [],
    startTime: mockHistoryEntry.startTime,
    endTime: mockHistoryEntry.endTime,
    metadata: {
      emotionProgression: ['neutral', 'happy', 'surprised'],
      messageCount: 5,
      duration: 300000,
      lastActivity: Date.now(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('saveDialogueHistory', () => {
    it('should save dialogue history to AsyncStorage', async () => {
      const history = [mockHistoryEntry];

      await historyService.saveDialogueHistory(history);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'dialogue_history',
        JSON.stringify(history)
      );
    });

    it('should handle save errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(historyService.saveDialogueHistory([mockHistoryEntry])).rejects.toThrow(
        'Failed to save dialogue history'
      );
    });
  });

  describe('loadDialogueHistory', () => {
    it('should load dialogue history from AsyncStorage', async () => {
      const history = [mockHistoryEntry];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const result = await historyService.loadDialogueHistory();

      expect(result).toEqual(history);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('dialogue_history');
    });

    it('should return empty array when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await historyService.loadDialogueHistory();

      expect(result).toEqual([]);
    });

    it('should handle load errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await historyService.loadDialogueHistory();

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await historyService.loadDialogueHistory();

      expect(result).toEqual([]);
    });
  });

  describe('saveConversation', () => {
    it('should save conversation to AsyncStorage', async () => {
      const dialogue = {
        id: 'test-dialogue-1',
        characterId: 'aoi' as const,
        scenario: mockHistoryEntry.scenario,
        messages: [],
        startTime: mockHistoryEntry.startTime,
        endTime: mockHistoryEntry.endTime,
        emotionProgression: ['neutral', 'happy'],
      };

      await historyService.saveConversation(dialogue);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conversation_history',
        expect.stringContaining(dialogue.id)
      );
    });

    it('should limit conversations to maxHistoryCount', async () => {
      const existingConversations = Array.from({ length: 60 }, (_, i) => ({
        ...mockConversation,
        id: `conversation-${i}`,
      }));

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'conversation_history') {
          return JSON.stringify(existingConversations);
        }
        if (key === 'history_settings') {
          return JSON.stringify({ maxHistoryCount: 50 });
        }
        return null;
      });

      const newDialogue = {
        id: 'new-dialogue',
        characterId: 'aoi' as const,
        scenario: mockHistoryEntry.scenario,
        messages: [],
        startTime: Date.now(),
        endTime: Date.now(),
        emotionProgression: ['neutral'],
      };

      await historyService.saveConversation(newDialogue);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedConversations = JSON.parse(savedData);
      expect(savedConversations).toHaveLength(50);
      expect(savedConversations[0].id).toBe('new-dialogue');
    });
  });

  describe('loadConversations', () => {
    it('should load conversations from AsyncStorage', async () => {
      const conversations = [mockConversation];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(conversations));

      const result = await historyService.loadConversations();

      expect(result).toEqual(conversations);
    });

    it('should return empty array when no conversations exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await historyService.loadConversations();

      expect(result).toEqual([]);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation by ID', async () => {
      const conversations = [mockConversation, { ...mockConversation, id: 'other-id' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(conversations));

      await historyService.deleteConversation('test-dialogue-1');

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedConversations = JSON.parse(savedData);
      expect(savedConversations).toHaveLength(1);
      expect(savedConversations[0].id).toBe('other-id');
    });
  });

  describe('getConversationsByCharacter', () => {
    it('should filter conversations by character', async () => {
      const conversations = [
        mockConversation,
        { ...mockConversation, id: 'shun-conv', characterId: 'shun' as const },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(conversations));

      const result = await historyService.getConversationsByCharacter('aoi');

      expect(result).toHaveLength(1);
      expect(result[0].characterId).toBe('aoi');
    });
  });

  describe('getConversationStats', () => {
    it('should return conversation statistics', async () => {
      const conversations = [
        mockConversation,
        { ...mockConversation, id: 'conv-2', characterId: 'shun' as const },
        { ...mockConversation, id: 'conv-3', characterId: 'aoi' as const },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(conversations));

      const stats = await historyService.getConversationStats();

      expect(stats.totalConversations).toBe(3);
      expect(stats.totalMessages).toBe(15); // 3 * 5 messages
      expect(stats.averageMessagesPerConversation).toBe(5);
      expect(stats.characterDistribution.aoi).toBe(2);
      expect(stats.characterDistribution.shun).toBe(1);
    });
  });

  describe('searchConversations', () => {
    it('should search conversations by text', async () => {
      const conversations = [
        mockConversation,
        {
          ...mockConversation,
          id: 'search-test',
          scenario: {
            ...mockConversation.scenario,
            title: '夜の会話',
            description: '夜の静かな時間',
          },
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(conversations));

      const result = await historyService.searchConversations('朝');

      expect(result).toHaveLength(1);
      expect(result[0].scenario.title).toBe('朝の挨拶');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const settings = await historyService.getSettings();

      expect(settings.maxHistoryCount).toBe(50);
      expect(settings.autoSaveEnabled).toBe(true);
      expect(settings.compressionEnabled).toBe(true);
    });

    it('should return stored settings', async () => {
      const storedSettings = { maxHistoryCount: 100, autoSaveEnabled: false };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedSettings));

      const settings = await historyService.getSettings();

      expect(settings.maxHistoryCount).toBe(100);
      expect(settings.autoSaveEnabled).toBe(false);
      expect(settings.compressionEnabled).toBe(true); // default value
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const currentSettings = { maxHistoryCount: 50, autoSaveEnabled: true };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(currentSettings));

      await historyService.updateSettings({ maxHistoryCount: 100 });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'history_settings',
        JSON.stringify({ 
          maxHistoryCount: 100, 
          autoSaveEnabled: true,
          compressionEnabled: true // Default value is added
        })
      );
    });
  });

  describe('exportHistory', () => {
    it('should export history data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'dialogue_history') return JSON.stringify([mockHistoryEntry]);
        if (key === 'conversation_history') return JSON.stringify([mockConversation]);
        if (key === 'history_settings') return JSON.stringify({ maxHistoryCount: 50 });
        return null;
      });

      const exportData = await historyService.exportHistory();
      const parsed = JSON.parse(exportData);

      expect(parsed.version).toBe('1.0');
      expect(parsed.history).toHaveLength(1);
      expect(parsed.conversations).toHaveLength(1);
      expect(parsed.settings.maxHistoryCount).toBe(50);
    });
  });

  describe('importHistory', () => {
    it('should import history data', async () => {
      const importData = {
        version: '1.0',
        history: [mockHistoryEntry],
        conversations: [mockConversation],
        settings: { maxHistoryCount: 100 },
      };

      await historyService.importHistory(JSON.stringify(importData));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'dialogue_history',
        JSON.stringify([mockHistoryEntry])
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conversation_history',
        JSON.stringify([mockConversation])
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'history_settings',
        JSON.stringify({ 
          maxHistoryCount: 100,
          autoSaveEnabled: true,
          compressionEnabled: true
        })
      );
    });

    it('should throw error for invalid import data', async () => {
      await expect(historyService.importHistory('invalid json')).rejects.toThrow(
        'Failed to import history'
      );
    });
  });
});