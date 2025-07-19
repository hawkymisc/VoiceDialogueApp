import {
  DialogueMessage,
  Conversation,
  ConversationSummary,
  EmotionType,
} from '../types/Dialogue';
import {CharacterType} from '../types/Character';
import {storageService} from './storageService';
import {openaiService} from './openaiService';

export interface ConversationFilter {
  characterId?: CharacterType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  emotions?: EmotionType[];
  isFavorite?: boolean;
  hasAudio?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface ConversationSearchQuery {
  query: string;
  filters: ConversationFilter;
  sortBy: 'date' | 'length' | 'rating' | 'title';
  sortOrder: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  averageLength: number;
  favoriteCharacter: CharacterType | null;
  emotionDistribution: Record<EmotionType, number>;
  conversationsByDay: Record<string, number>;
  longestConversation: string | null;
  mostRecentConversation: string | null;
}

export interface ConversationAnalysis {
  conversationId: string;
  characterAnalysis: {
    dominantPersonality: string[];
    emotionalRange: EmotionType[];
    conversationStyle: string;
  };
  userAnalysis: {
    preferredTopics: string[];
    conversationPatterns: string[];
    emotionalResponses: EmotionType[];
  };
  relationshipProgress: {
    intimacyLevel: number;
    keyMoments: Array<{
      messageId: string;
      moment: string;
      emotion: EmotionType;
      significance: number;
    }>;
  };
  suggestions: {
    nextTopics: string[];
    improvementAreas: string[];
    scenarioRecommendations: string[];
  };
}

class ConversationService {
  private conversations: Map<string, Conversation> = new Map();
  private summaries: Map<string, ConversationSummary> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadConversationsFromStorage();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize conversation service:', error);
    }
  }

  private async loadConversationsFromStorage(): Promise<void> {
    try {
      // This would load conversation data from storage
      // Implementation depends on the storage structure
      const conversationData = await storageService.getFavoriteConversations();
      // Process and load conversation data
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
    }
  }

  // Conversation CRUD operations
  async createConversation(
    characterId: CharacterType,
    scenario?: string,
    title?: string
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      characterId,
      title: title || this.generateDefaultTitle(characterId, scenario),
      scenario,
      messages: [],
      startedAt: new Date(),
      lastMessageAt: new Date(),
      isFavorite: false,
      tags: [],
      summary: '',
      metadata: {
        totalMessages: 0,
        averageResponseTime: 0,
        emotionalArc: [],
        keyMoments: [],
        userSatisfaction: undefined,
      },
    };

    this.conversations.set(conversation.id, conversation);
    await this.saveConversation(conversation);

    return conversation;
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      return conversation;
    }

    // Try loading from storage
    try {
      const savedConversation = await this.loadConversationFromStorage(conversationId);
      if (savedConversation) {
        this.conversations.set(conversationId, savedConversation);
        return savedConversation;
      }
    } catch (error) {
      console.error('Failed to load conversation from storage:', error);
    }

    return null;
  }

  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    const updatedConversation = { ...conversation, ...updates };
    this.conversations.set(conversationId, updatedConversation);
    await this.saveConversation(updatedConversation);

    return updatedConversation;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    this.conversations.delete(conversationId);
    this.summaries.delete(conversationId);

    try {
      // Delete from storage
      await this.deleteConversationFromStorage(conversationId);
      return true;
    } catch (error) {
      console.error('Failed to delete conversation from storage:', error);
      return false;
    }
  }

  // Message management
  async addMessage(
    conversationId: string,
    message: Omit<DialogueMessage, 'id' | 'timestamp'>
  ): Promise<DialogueMessage | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    const newMessage: DialogueMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();
    conversation.metadata.totalMessages = conversation.messages.length;

    // Update emotional arc
    if (newMessage.emotion) {
      conversation.metadata.emotionalArc.push({
        messageIndex: conversation.messages.length - 1,
        emotion: newMessage.emotion,
        timestamp: newMessage.timestamp,
      });
    }

    await this.saveConversation(conversation);

    return newMessage;
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<DialogueMessage>
  ): Promise<DialogueMessage | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return null;
    }

    const updatedMessage = { ...conversation.messages[messageIndex], ...updates };
    conversation.messages[messageIndex] = updatedMessage;

    await this.saveConversation(conversation);

    return updatedMessage;
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return false;
    }

    conversation.messages.splice(messageIndex, 1);
    conversation.metadata.totalMessages = conversation.messages.length;

    await this.saveConversation(conversation);

    return true;
  }

  // Search and filtering
  async searchConversations(query: ConversationSearchQuery): Promise<Conversation[]> {
    let results = Array.from(this.conversations.values());

    // Apply text search
    if (query.query.trim()) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(conversation =>
        conversation.title.toLowerCase().includes(searchTerm) ||
        conversation.summary.toLowerCase().includes(searchTerm) ||
        conversation.messages.some(message =>
          message.text.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Apply filters
    results = this.applyConversationFilters(results, query.filters);

    // Apply sorting
    results = this.sortConversations(results, query.sortBy, query.sortOrder);

    // Apply pagination
    if (query.offset !== undefined) {
      results = results.slice(query.offset);
    }
    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  private applyConversationFilters(
    conversations: Conversation[],
    filters: ConversationFilter
  ): Conversation[] {
    let filtered = [...conversations];

    if (filters.characterId) {
      filtered = filtered.filter(c => c.characterId === filters.characterId);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(c =>
        c.startedAt >= filters.dateRange!.start &&
        c.startedAt <= filters.dateRange!.end
      );
    }

    if (filters.emotions) {
      filtered = filtered.filter(c =>
        c.metadata.emotionalArc.some(arc =>
          filters.emotions!.includes(arc.emotion)
        )
      );
    }

    if (filters.isFavorite !== undefined) {
      filtered = filtered.filter(c => c.isFavorite === filters.isFavorite);
    }

    if (filters.hasAudio !== undefined) {
      filtered = filtered.filter(c =>
        c.messages.some(m => Boolean(m.audioUrl)) === filters.hasAudio
      );
    }

    if (filters.minLength !== undefined) {
      filtered = filtered.filter(c => c.messages.length >= filters.minLength!);
    }

    if (filters.maxLength !== undefined) {
      filtered = filtered.filter(c => c.messages.length <= filters.maxLength!);
    }

    return filtered;
  }

  private sortConversations(
    conversations: Conversation[],
    sortBy: string,
    order: 'asc' | 'desc'
  ): Conversation[] {
    const sorted = [...conversations].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.lastMessageAt.getTime() - b.lastMessageAt.getTime();
          break;
        case 'length':
          comparison = a.messages.length - b.messages.length;
          break;
        case 'rating':
          const ratingA = a.metadata.userSatisfaction || 0;
          const ratingB = b.metadata.userSatisfaction || 0;
          comparison = ratingA - ratingB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  // Conversation analysis and summary
  async generateSummary(conversationId: string): Promise<ConversationSummary | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || conversation.messages.length === 0) {
      return null;
    }

    try {
      // Generate summary using OpenAI
      const messages = conversation.messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const summaryText = await openaiService.summarizeConversation(messages);

      const summary: ConversationSummary = {
        id: `summary_${conversationId}`,
        conversationId,
        content: summaryText,
        keyTopics: this.extractKeyTopics(conversation),
        emotionalHighlights: this.extractEmotionalHighlights(conversation),
        characterInsights: this.generateCharacterInsights(conversation),
        generatedAt: new Date(),
      };

      this.summaries.set(conversationId, summary);
      
      // Update conversation with summary
      await this.updateConversation(conversationId, { summary: summaryText });

      return summary;
    } catch (error) {
      console.error('Failed to generate conversation summary:', error);
      return null;
    }
  }

  private extractKeyTopics(conversation: Conversation): string[] {
    const topics: string[] = [];
    const messages = conversation.messages;

    // Simple keyword extraction (could be enhanced with NLP)
    const keywords = new Map<string, number>();
    
    messages.forEach(message => {
      const words = message.text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      words.forEach(word => {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      });
    });

    // Get top keywords
    const sortedKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return sortedKeywords;
  }

  private extractEmotionalHighlights(conversation: Conversation): Array<{
    emotion: EmotionType;
    context: string;
    messageId: string;
  }> {
    const highlights: Array<{
      emotion: EmotionType;
      context: string;
      messageId: string;
    }> = [];

    conversation.messages.forEach(message => {
      if (message.emotion && message.emotion !== 'neutral') {
        highlights.push({
          emotion: message.emotion,
          context: message.text.substring(0, 100) + '...',
          messageId: message.id,
        });
      }
    });

    return highlights.slice(0, 5); // Top 5 emotional moments
  }

  private generateCharacterInsights(conversation: Conversation): string[] {
    const insights: string[] = [];
    const characterMessages = conversation.messages.filter(m => m.sender === 'character');

    if (characterMessages.length === 0) {
      return insights;
    }

    // Analyze emotion distribution
    const emotions = characterMessages
      .filter(m => m.emotion)
      .map(m => m.emotion!);

    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<EmotionType, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (dominantEmotion) {
      insights.push(`主な感情: ${this.getEmotionDisplayName(dominantEmotion[0] as EmotionType)}`);
    }

    // Analyze conversation style
    const avgMessageLength = characterMessages.reduce((sum, m) => sum + m.text.length, 0) / characterMessages.length;
    if (avgMessageLength > 100) {
      insights.push('詳しく話すタイプ');
    } else if (avgMessageLength < 50) {
      insights.push('簡潔に話すタイプ');
    }

    return insights;
  }

  private getEmotionDisplayName(emotion: EmotionType): string {
    const emotionNames: Record<EmotionType, string> = {
      neutral: '中立',
      happy: '嬉しい',
      sad: '悲しい',
      angry: '怒り',
      surprised: '驚き',
      embarrassed: '恥ずかし',
    };

    return emotionNames[emotion] || emotion;
  }

  // Statistics and analytics
  async getConversationStats(userId?: string): Promise<ConversationStats> {
    const conversations = Array.from(this.conversations.values());
    
    if (conversations.length === 0) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageLength: 0,
        favoriteCharacter: null,
        emotionDistribution: {
          neutral: 0,
          happy: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          embarrassed: 0,
        },
        conversationsByDay: {},
        longestConversation: null,
        mostRecentConversation: null,
      };
    }

    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const averageLength = totalMessages / conversations.length;

    // Character usage analysis
    const characterCounts: Record<CharacterType, number> = { aoi: 0, shun: 0 };
    conversations.forEach(c => {
      characterCounts[c.characterId] += 1;
    });

    const favoriteCharacter = Object.entries(characterCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as CharacterType || null;

    // Emotion distribution
    const emotionDistribution: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      embarrassed: 0,
    };

    conversations.forEach(c => {
      c.metadata.emotionalArc.forEach(arc => {
        emotionDistribution[arc.emotion] += 1;
      });
    });

    // Conversations by day
    const conversationsByDay: Record<string, number> = {};
    conversations.forEach(c => {
      const day = c.startedAt.toISOString().split('T')[0];
      conversationsByDay[day] = (conversationsByDay[day] || 0) + 1;
    });

    // Longest and most recent conversations
    const longestConversation = conversations
      .sort((a, b) => b.messages.length - a.messages.length)[0]?.id || null;

    const mostRecentConversation = conversations
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())[0]?.id || null;

    return {
      totalConversations: conversations.length,
      totalMessages,
      averageLength,
      favoriteCharacter,
      emotionDistribution,
      conversationsByDay,
      longestConversation,
      mostRecentConversation,
    };
  }

  // Favorites management
  async toggleFavorite(conversationId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.isFavorite = !conversation.isFavorite;
    await this.saveConversation(conversation);

    return conversation.isFavorite;
  }

  async getFavoriteConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(c => c.isFavorite);
  }

  // Export and import
  async exportConversations(conversationIds?: string[]): Promise<string> {
    const conversationsToExport = conversationIds
      ? conversationIds.map(id => this.conversations.get(id)).filter(Boolean) as Conversation[]
      : Array.from(this.conversations.values());

    const exportData = {
      conversations: conversationsToExport,
      summaries: conversationIds
        ? conversationIds.map(id => this.summaries.get(id)).filter(Boolean)
        : Array.from(this.summaries.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importConversations(data: string): Promise<number> {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.conversations || !Array.isArray(importData.conversations)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;

      for (const conversation of importData.conversations) {
        // Ensure unique IDs
        conversation.id = this.generateConversationId();
        conversation.messages.forEach((message: DialogueMessage) => {
          message.id = this.generateMessageId();
        });

        this.conversations.set(conversation.id, conversation);
        await this.saveConversation(conversation);
        importedCount++;
      }

      // Import summaries if available
      if (importData.summaries && Array.isArray(importData.summaries)) {
        for (const summary of importData.summaries) {
          this.summaries.set(summary.conversationId, summary);
        }
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      throw new Error('Conversation import failed');
    }
  }

  // Helper methods
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDefaultTitle(characterId: CharacterType, scenario?: string): string {
    const characterName = characterId === 'aoi' ? '蒼' : '瞬';
    const date = new Date().toLocaleDateString('ja-JP');
    
    if (scenario) {
      return `${characterName}との${scenario} - ${date}`;
    }
    
    return `${characterName}との会話 - ${date}`;
  }

  private async saveConversation(conversation: Conversation): Promise<void> {
    try {
      await storageService.saveConversationHistory(conversation.id, conversation.messages);
      // Additional conversation metadata could be saved separately
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  private async loadConversationFromStorage(conversationId: string): Promise<Conversation | null> {
    try {
      const messages = await storageService.getConversationHistory(conversationId);
      if (messages.length === 0) {
        return null;
      }

      // Reconstruct conversation from messages
      // This is a simplified implementation
      return null;
    } catch (error) {
      console.error('Failed to load conversation from storage:', error);
      return null;
    }
  }

  private async deleteConversationFromStorage(conversationId: string): Promise<void> {
    try {
      // Delete conversation data from storage
      // Implementation depends on storage structure
    } catch (error) {
      console.error('Failed to delete conversation from storage:', error);
    }
  }
}

export const conversationService = new ConversationService();