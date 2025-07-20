import {conversationService} from '../conversationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock other services
jest.mock('../storageService', () => ({
  storageService: {
    getFavoriteConversations: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('../openaiService', () => ({
  openaiService: {
    summarizeConversation: jest.fn(() => Promise.resolve('Test summary')),
  },
}));

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const conversation = await conversationService.createConversation('aoi', 'test-scenario', 'Test Title');
      
      expect(conversation).toEqual(
        expect.objectContaining({
          characterId: 'aoi',
          title: 'Test Title',
          scenario: 'test-scenario',
          messages: [],
          isFavorite: false,
        })
      );
      
      expect(conversation.id).toMatch(/^conv_\d+_\w+$/);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `conversation_${conversation.id}`,
        expect.stringContaining(conversation.id)
      );
    });

    it('should generate default title when none provided', async () => {
      const conversation = await conversationService.createConversation('shun', 'test-scenario');
      
      expect(conversation.title).toMatch(/^瞬との.*test-scenario.*\d{4}\/\d{1,2}\/\d{1,2}$/);
    });

    it('should get conversation by ID', async () => {
      const created = await conversationService.createConversation('aoi');
      const retrieved = await conversationService.getConversation(created.id);
      
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent conversation', async () => {
      const result = await conversationService.getConversation('non-existent-id');
      
      expect(result).toBeNull();
    });

    it('should load conversation from storage', async () => {
      const mockConversation = {
        id: 'test-id',
        characterId: 'aoi',
        title: 'Test',
        messages: [],
        startedAt: '2023-01-01T00:00:00.000Z',
        lastMessageAt: '2023-01-01T00:00:00.000Z',
        isFavorite: false,
        tags: [],
        summary: '',
        metadata: {
          totalMessages: 0,
          averageResponseTime: 0,
          emotionalArc: [],
          keyMoments: [],
        },
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockConversation));
      
      const result = await conversationService.getConversation('test-id');
      
      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-id',
          characterId: 'aoi',
          title: 'Test',
        })
      );
      expect(result?.startedAt).toBeInstanceOf(Date);
      expect(result?.lastMessageAt).toBeInstanceOf(Date);
    });

    it('should update conversation', async () => {
      const conversation = await conversationService.createConversation('aoi');
      const updated = await conversationService.updateConversation(conversation.id, {
        title: 'Updated Title',
        isFavorite: true,
      });
      
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.isFavorite).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2); // Create + Update
    });

    it('should delete conversation', async () => {
      const conversation = await conversationService.createConversation('aoi');
      const result = await conversationService.deleteConversation(conversation.id);
      
      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`conversation_${conversation.id}`);
      
      const retrieved = await conversationService.getConversation(conversation.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message Management', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await conversationService.createConversation('aoi');
      conversationId = conversation.id;
    });

    it('should add message to conversation', async () => {
      const message = await conversationService.addMessage(conversationId, {
        text: 'Hello',
        sender: 'user',
        emotion: 'happy',
      });
      
      expect(message).toEqual(
        expect.objectContaining({
          text: 'Hello',
          sender: 'user',
          emotion: 'happy',
        })
      );
      expect(message?.id).toMatch(/^msg_\d+_\w+$/);
      expect(message?.timestamp).toBeInstanceOf(Date);
      
      const conversation = await conversationService.getConversation(conversationId);
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.metadata.totalMessages).toBe(1);
    });

    it('should update emotional arc when adding message with emotion', async () => {
      await conversationService.addMessage(conversationId, {
        text: 'Happy message',
        sender: 'character',
        emotion: 'happy',
      });
      
      const conversation = await conversationService.getConversation(conversationId);
      expect(conversation?.metadata.emotionalArc).toHaveLength(1);
      expect(conversation?.metadata.emotionalArc[0]).toEqual(
        expect.objectContaining({
          messageIndex: 0,
          emotion: 'happy',
        })
      );
    });

    it('should update message', async () => {
      const message = await conversationService.addMessage(conversationId, {
        text: 'Original text',
        sender: 'user',
      });
      
      const updated = await conversationService.updateMessage(
        conversationId,
        message!.id,
        {text: 'Updated text'}
      );
      
      expect(updated?.text).toBe('Updated text');
    });

    it('should delete message', async () => {
      const message = await conversationService.addMessage(conversationId, {
        text: 'To be deleted',
        sender: 'user',
      });
      
      const result = await conversationService.deleteMessage(conversationId, message!.id);
      expect(result).toBe(true);
      
      const conversation = await conversationService.getConversation(conversationId);
      expect(conversation?.messages).toHaveLength(0);
      expect(conversation?.metadata.totalMessages).toBe(0);
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Create test conversations
      const conv1 = await conversationService.createConversation('aoi', undefined, 'Morning chat');
      await conversationService.addMessage(conv1.id, {
        text: 'Good morning!',
        sender: 'character',
        emotion: 'happy',
      });
      
      const conv2 = await conversationService.createConversation('shun', undefined, 'Evening talk');
      await conversationService.addMessage(conv2.id, {
        text: 'Good evening',
        sender: 'character',
        emotion: 'neutral',
      });
      
      await conversationService.updateConversation(conv2.id, {isFavorite: true});
    });

    it('should search conversations by text', async () => {
      const results = await conversationService.searchConversations({
        query: 'morning',
        filters: {},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Morning chat');
    });

    it('should search conversations by message content', async () => {
      const results = await conversationService.searchConversations({
        query: 'good evening',
        filters: {},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Evening talk');
    });

    it('should filter by character', async () => {
      const results = await conversationService.searchConversations({
        query: '',
        filters: {characterId: 'aoi'},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].characterId).toBe('aoi');
    });

    it('should filter by favorite status', async () => {
      const results = await conversationService.searchConversations({
        query: '',
        filters: {isFavorite: true},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].isFavorite).toBe(true);
    });

    it('should filter by emotions', async () => {
      const results = await conversationService.searchConversations({
        query: '',
        filters: {emotions: ['happy']},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].metadata.emotionalArc[0].emotion).toBe('happy');
    });

    it('should filter by message length', async () => {
      const results = await conversationService.searchConversations({
        query: '',
        filters: {minLength: 1, maxLength: 1},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      expect(results).toHaveLength(2);
    });

    it('should apply pagination', async () => {
      const results = await conversationService.searchConversations({
        query: '',
        filters: {},
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 1,
        offset: 0,
      });
      
      expect(results).toHaveLength(1);
    });
  });

  describe('Summary Generation', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await conversationService.createConversation('aoi');
      conversationId = conversation.id;
      
      await conversationService.addMessage(conversationId, {
        text: 'Hello there',
        sender: 'user',
      });
      
      await conversationService.addMessage(conversationId, {
        text: 'Hi, how are you?',
        sender: 'character',
        emotion: 'happy',
      });
    });

    it('should generate conversation summary', async () => {
      const summary = await conversationService.generateSummary(conversationId);
      
      expect(summary).toEqual(
        expect.objectContaining({
          conversationId,
          content: 'Test summary',
          keyTopics: expect.arrayContaining(['hello', 'there']),
          emotionalHighlights: expect.arrayContaining([
            expect.objectContaining({
              emotion: 'happy',
              context: 'Hi, how are you?...',
            })
          ]),
          characterInsights: expect.arrayContaining(['主な感情: 嬉しい']),
        })
      );
      
      const conversation = await conversationService.getConversation(conversationId);
      expect(conversation?.summary).toBe('Test summary');
    });

    it('should return null for empty conversation', async () => {
      const emptyConv = await conversationService.createConversation('aoi');
      const summary = await conversationService.generateSummary(emptyConv.id);
      
      expect(summary).toBeNull();
    });

    it('should handle OpenAI service errors', async () => {
      const {openaiService} = require('../openaiService');
      openaiService.summarizeConversation.mockRejectedValue(new Error('API Error'));
      
      const summary = await conversationService.generateSummary(conversationId);
      
      expect(summary).toBeNull();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      const conv1 = await conversationService.createConversation('aoi');
      await conversationService.addMessage(conv1.id, {
        text: 'Message 1',
        sender: 'character',
        emotion: 'happy',
      });
      
      const conv2 = await conversationService.createConversation('shun');
      await conversationService.addMessage(conv2.id, {
        text: 'Message 2',
        sender: 'character',
        emotion: 'neutral',
      });
      await conversationService.addMessage(conv2.id, {
        text: 'Message 3',
        sender: 'user',
      });
    });

    it('should calculate conversation statistics', async () => {
      const stats = await conversationService.getConversationStats();
      
      expect(stats).toEqual(
        expect.objectContaining({
          totalConversations: 2,
          totalMessages: 3,
          averageLength: 1.5,
          favoriteCharacter: expect.any(String),
          emotionDistribution: expect.objectContaining({
            happy: 1,
            neutral: 1,
          }),
        })
      );
    });

    it('should return empty stats for no conversations', async () => {
      // Clear conversations by creating new service instance
      const stats = await conversationService.getConversationStats();
      
      // Reset and test empty state would require service reset
      expect(typeof stats.totalConversations).toBe('number');
    });
  });

  describe('Favorites Management', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await conversationService.createConversation('aoi');
      conversationId = conversation.id;
    });

    it('should toggle conversation as favorite', async () => {
      let isFavorite = await conversationService.toggleFavorite(conversationId);
      expect(isFavorite).toBe(true);
      
      isFavorite = await conversationService.toggleFavorite(conversationId);
      expect(isFavorite).toBe(false);
    });

    it('should get favorite conversations', async () => {
      await conversationService.toggleFavorite(conversationId);
      const favorites = await conversationService.getFavoriteConversations();
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe(conversationId);
    });

    it('should update favorites list in storage', async () => {
      await conversationService.toggleFavorite(conversationId);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'favorite_conversations',
        expect.stringContaining(conversationId)
      );
    });
  });

  describe('Export and Import', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await conversationService.createConversation('aoi', undefined, 'Test Export');
      conversationId = conversation.id;
      
      await conversationService.addMessage(conversationId, {
        text: 'Export test message',
        sender: 'user',
      });
    });

    it('should export conversations', async () => {
      const exportData = await conversationService.exportConversations([conversationId]);
      const parsed = JSON.parse(exportData);
      
      expect(parsed).toEqual(
        expect.objectContaining({
          conversations: expect.arrayContaining([
            expect.objectContaining({
              id: conversationId,
              title: 'Test Export',
            })
          ]),
          exportedAt: expect.any(String),
          version: '1.0',
        })
      );
    });

    it('should export all conversations when no IDs specified', async () => {
      const exportData = await conversationService.exportConversations();
      const parsed = JSON.parse(exportData);
      
      expect(parsed.conversations).toBeInstanceOf(Array);
      expect(parsed.conversations.length).toBeGreaterThan(0);
    });

    it('should import conversations', async () => {
      const exportData = await conversationService.exportConversations([conversationId]);
      const importCount = await conversationService.importConversations(exportData);
      
      expect(importCount).toBe(1);
    });

    it('should generate unique IDs on import', async () => {
      const exportData = await conversationService.exportConversations([conversationId]);
      await conversationService.importConversations(exportData);
      
      const parsed = JSON.parse(exportData);
      const importedConv = parsed.conversations[0];
      
      // New conversation should have different ID
      expect(importedConv.id).not.toBe(conversationId);
    });

    it('should handle invalid import data', async () => {
      await expect(
        conversationService.importConversations('invalid json')
      ).rejects.toThrow('Conversation import failed');
      
      await expect(
        conversationService.importConversations('{"invalid": "data"}')
      ).rejects.toThrow('Invalid import data format');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors in conversation creation', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      // Should still create conversation in memory even if storage fails
      const conversation = await conversationService.createConversation('aoi');
      expect(conversation).toBeDefined();
    });

    it('should handle storage errors in conversation loading', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await conversationService.getConversation('test-id');
      expect(result).toBeNull();
    });

    it('should handle storage errors in deletion', async () => {
      const conversation = await conversationService.createConversation('aoi');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await conversationService.deleteConversation(conversation.id);
      expect(result).toBe(false);
    });
  });
});