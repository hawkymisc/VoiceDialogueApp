import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dialogue,
  DialogueHistoryEntry,
  DialogueMessage,
  DialogueScenario,
} from '../types/Dialogue';
import {CharacterType} from '../types/Character';

const STORAGE_KEYS = {
  DIALOGUE_HISTORY: 'dialogue_history',
  CONVERSATION_HISTORY: 'conversation_history',
  SETTINGS: 'history_settings',
};

export interface HistorySettings {
  maxHistoryCount: number;
  autoSaveEnabled: boolean;
  compressionEnabled: boolean;
}

export interface ConversationSaveData {
  id: string;
  characterId: CharacterType;
  scenario: DialogueScenario;
  messages: DialogueMessage[];
  startTime: number;
  endTime: number | null;
  metadata: {
    emotionProgression: string[];
    messageCount: number;
    duration: number;
    lastActivity: number;
  };
}

class HistoryService {
  private defaultSettings: HistorySettings = {
    maxHistoryCount: 50,
    autoSaveEnabled: true,
    compressionEnabled: true,
  };

  async saveDialogueHistory(history: DialogueHistoryEntry[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(history);
      await AsyncStorage.setItem(STORAGE_KEYS.DIALOGUE_HISTORY, jsonValue);
    } catch (error) {
      console.error('Error saving dialogue history:', error);
      throw new Error('Failed to save dialogue history');
    }
  }

  async loadDialogueHistory(): Promise<DialogueHistoryEntry[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.DIALOGUE_HISTORY);
      if (jsonValue) {
        const history = JSON.parse(jsonValue);
        return Array.isArray(history) ? history : [];
      }
      return [];
    } catch (error) {
      console.error('Error loading dialogue history:', error);
      return [];
    }
  }

  async saveConversation(dialogue: Dialogue): Promise<void> {
    try {
      const existingConversations = await this.loadConversations();
      
      const conversationData: ConversationSaveData = {
        id: dialogue.id,
        characterId: dialogue.characterId,
        scenario: dialogue.scenario,
        messages: dialogue.messages,
        startTime: dialogue.startTime,
        endTime: dialogue.endTime,
        metadata: {
          emotionProgression: dialogue.emotionProgression,
          messageCount: dialogue.messages.length,
          duration: dialogue.endTime ? dialogue.endTime - dialogue.startTime : 0,
          lastActivity: Date.now(),
        },
      };

      const updatedConversations = [
        conversationData,
        ...existingConversations.filter(conv => conv.id !== dialogue.id),
      ];

      const settings = await this.getSettings();
      if (updatedConversations.length > settings.maxHistoryCount) {
        updatedConversations.splice(settings.maxHistoryCount);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.CONVERSATION_HISTORY,
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw new Error('Failed to save conversation');
    }
  }

  async loadConversations(): Promise<ConversationSaveData[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
      if (jsonValue) {
        const conversations = JSON.parse(jsonValue);
        return Array.isArray(conversations) ? conversations : [];
      }
      return [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  async loadConversationById(id: string): Promise<ConversationSaveData | null> {
    try {
      const conversations = await this.loadConversations();
      return conversations.find(conv => conv.id === id) || null;
    } catch (error) {
      console.error('Error loading conversation by ID:', error);
      return null;
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const conversations = await this.loadConversations();
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.CONVERSATION_HISTORY,
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  async deleteAllConversations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      throw new Error('Failed to delete all conversations');
    }
  }

  async getConversationsByCharacter(characterId: CharacterType): Promise<ConversationSaveData[]> {
    try {
      const conversations = await this.loadConversations();
      return conversations.filter(conv => conv.characterId === characterId);
    } catch (error) {
      console.error('Error getting conversations by character:', error);
      return [];
    }
  }

  async getConversationsByScenario(scenarioId: string): Promise<ConversationSaveData[]> {
    try {
      const conversations = await this.loadConversations();
      return conversations.filter(conv => conv.scenario.id === scenarioId);
    } catch (error) {
      console.error('Error getting conversations by scenario:', error);
      return [];
    }
  }

  async getConversationStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    characterDistribution: Record<CharacterType, number>;
    scenarioDistribution: Record<string, number>;
  }> {
    try {
      const conversations = await this.loadConversations();
      
      const totalConversations = conversations.length;
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.metadata.messageCount, 0);
      const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
      
      const characterDistribution: Record<CharacterType, number> = {} as any;
      const scenarioDistribution: Record<string, number> = {};
      
      conversations.forEach(conv => {
        characterDistribution[conv.characterId] = (characterDistribution[conv.characterId] || 0) + 1;
        scenarioDistribution[conv.scenario.id] = (scenarioDistribution[conv.scenario.id] || 0) + 1;
      });

      return {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation,
        characterDistribution,
        scenarioDistribution,
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        characterDistribution: {} as any,
        scenarioDistribution: {},
      };
    }
  }

  async searchConversations(query: string): Promise<ConversationSaveData[]> {
    try {
      const conversations = await this.loadConversations();
      const lowercaseQuery = query.toLowerCase();
      
      return conversations.filter(conv => 
        conv.scenario.title.toLowerCase().includes(lowercaseQuery) ||
        conv.scenario.description.toLowerCase().includes(lowercaseQuery) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  async addToHistory(historyEntry: DialogueHistoryEntry): Promise<void> {
    try {
      const history = await this.loadDialogueHistory();
      const existingIndex = history.findIndex(entry => entry.id === historyEntry.id);
      
      if (existingIndex >= 0) {
        history[existingIndex] = historyEntry;
      } else {
        history.unshift(historyEntry);
      }

      const settings = await this.getSettings();
      if (history.length > settings.maxHistoryCount) {
        history.splice(settings.maxHistoryCount);
      }

      await this.saveDialogueHistory(history);
    } catch (error) {
      console.error('Error adding to history:', error);
      throw new Error('Failed to add to history');
    }
  }

  async removeFromHistory(historyId: string): Promise<void> {
    try {
      const history = await this.loadDialogueHistory();
      const updatedHistory = history.filter(entry => entry.id !== historyId);
      await this.saveDialogueHistory(updatedHistory);
    } catch (error) {
      console.error('Error removing from history:', error);
      throw new Error('Failed to remove from history');
    }
  }

  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DIALOGUE_HISTORY);
      await AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    } catch (error) {
      console.error('Error clearing all history:', error);
      throw new Error('Failed to clear all history');
    }
  }

  async getSettings(): Promise<HistorySettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (jsonValue) {
        const settings = JSON.parse(jsonValue);
        return {...this.defaultSettings, ...settings};
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(settings: Partial<HistorySettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {...currentSettings, ...settings};
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  async exportHistory(): Promise<string> {
    try {
      const history = await this.loadDialogueHistory();
      const conversations = await this.loadConversations();
      const settings = await this.getSettings();
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        history,
        conversations,
        settings,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting history:', error);
      throw new Error('Failed to export history');
    }
  }

  async importHistory(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (importData.version && importData.history && importData.conversations) {
        if (importData.history && Array.isArray(importData.history)) {
          await this.saveDialogueHistory(importData.history);
        }
        
        if (importData.conversations && Array.isArray(importData.conversations)) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.CONVERSATION_HISTORY,
            JSON.stringify(importData.conversations)
          );
        }
        
        if (importData.settings) {
          await this.updateSettings(importData.settings);
        }
      } else {
        throw new Error('Invalid import data format');
      }
    } catch (error) {
      console.error('Error importing history:', error);
      throw new Error('Failed to import history');
    }
  }
}

export const historyService = new HistoryService();