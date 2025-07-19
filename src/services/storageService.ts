import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserProfile, UserPreferences} from '../types/User';

export interface StorageService {
  saveUserProfile(profile: UserProfile): Promise<void>;
  getUserProfile(): Promise<UserProfile | null>;
  saveUserPreferences(preferences: UserPreferences): Promise<void>;
  getUserPreferences(): Promise<UserPreferences | null>;
  saveFavoriteConversations(conversationIds: string[]): Promise<void>;
  getFavoriteConversations(): Promise<string[]>;
  saveUnlockedContent(contentIds: string[]): Promise<void>;
  getUnlockedContent(): Promise<string[]>;
  clearAllData(): Promise<void>;
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
}

const STORAGE_KEYS = {
  USER_PROFILE: 'USER_PROFILE',
  USER_PREFERENCES: 'USER_PREFERENCES',
  FAVORITE_CONVERSATIONS: 'FAVORITE_CONVERSATIONS',
  UNLOCKED_CONTENT: 'UNLOCKED_CONTENT',
  CONVERSATION_HISTORY: 'CONVERSATION_HISTORY',
  USER_STATISTICS: 'USER_STATISTICS',
  LAST_BACKUP: 'LAST_BACKUP',
} as const;

class StorageServiceImpl implements StorageService {
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const serializedProfile = JSON.stringify({
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        lastLoginAt: profile.lastLoginAt.toISOString(),
        statistics: {
          ...profile.statistics,
          lastActiveDate: profile.statistics.lastActiveDate.toISOString(),
        },
      });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, serializedProfile);
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw new Error('ユーザープロファイルの保存に失敗しました');
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const serializedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!serializedProfile) return null;

      const profile = JSON.parse(serializedProfile);
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        lastLoginAt: new Date(profile.lastLoginAt),
        statistics: {
          ...profile.statistics,
          lastActiveDate: new Date(profile.statistics.lastActiveDate),
        },
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const serializedPreferences = JSON.stringify(preferences);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, serializedPreferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error('ユーザー設定の保存に失敗しました');
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const serializedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!serializedPreferences) return null;

      return JSON.parse(serializedPreferences);
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  async saveFavoriteConversations(conversationIds: string[]): Promise<void> {
    try {
      const serializedConversations = JSON.stringify(conversationIds);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_CONVERSATIONS, serializedConversations);
    } catch (error) {
      console.error('Failed to save favorite conversations:', error);
      throw new Error('お気に入り会話の保存に失敗しました');
    }
  }

  async getFavoriteConversations(): Promise<string[]> {
    try {
      const serializedConversations = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_CONVERSATIONS);
      if (!serializedConversations) return [];

      return JSON.parse(serializedConversations);
    } catch (error) {
      console.error('Failed to get favorite conversations:', error);
      return [];
    }
  }

  async saveUnlockedContent(contentIds: string[]): Promise<void> {
    try {
      const serializedContent = JSON.stringify(contentIds);
      await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_CONTENT, serializedContent);
    } catch (error) {
      console.error('Failed to save unlocked content:', error);
      throw new Error('アンロックコンテンツの保存に失敗しました');
    }
  }

  async getUnlockedContent(): Promise<string[]> {
    try {
      const serializedContent = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_CONTENT);
      if (!serializedContent) return [];

      return JSON.parse(serializedContent);
    } catch (error) {
      console.error('Failed to get unlocked content:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('データの削除に失敗しました');
    }
  }

  async exportData(): Promise<string> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      
      const exportData: Record<string, any> = {};
      keyValuePairs.forEach(([key, value]) => {
        if (value !== null) {
          exportData[key] = JSON.parse(value);
        }
      });

      exportData.exportDate = new Date().toISOString();
      exportData.version = '1.0';

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }

  async importData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.version) {
        throw new Error('無効なデータ形式です');
      }

      const keyValuePairs: [string, string][] = [];
      Object.entries(importData).forEach(([key, value]) => {
        if (key !== 'exportDate' && key !== 'version' && value !== null) {
          keyValuePairs.push([key, JSON.stringify(value)]);
        }
      });

      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Failed to import data:', error);
      if (error instanceof Error && error.message === '無効なデータ形式です') {
        throw error;
      }
      throw new Error('データのインポートに失敗しました');
    }
  }

  async saveConversationHistory(conversationId: string, history: any[]): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.CONVERSATION_HISTORY}_${conversationId}`;
      const serializedHistory = JSON.stringify(history);
      await AsyncStorage.setItem(key, serializedHistory);
    } catch (error) {
      console.error('Failed to save conversation history:', error);
      throw new Error('会話履歴の保存に失敗しました');
    }
  }

  async getConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const key = `${STORAGE_KEYS.CONVERSATION_HISTORY}_${conversationId}`;
      const serializedHistory = await AsyncStorage.getItem(key);
      if (!serializedHistory) return [];

      return JSON.parse(serializedHistory);
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  async saveUserStatistics(statistics: any): Promise<void> {
    try {
      const serializedStats = JSON.stringify({
        ...statistics,
        lastActiveDate: statistics.lastActiveDate.toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATISTICS, serializedStats);
    } catch (error) {
      console.error('Failed to save user statistics:', error);
      throw new Error('ユーザー統計の保存に失敗しました');
    }
  }

  async getUserStatistics(): Promise<any | null> {
    try {
      const serializedStats = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATISTICS);
      if (!serializedStats) return null;

      const stats = JSON.parse(serializedStats);
      return {
        ...stats,
        lastActiveDate: new Date(stats.lastActiveDate),
      };
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      return null;
    }
  }

  async getStorageInfo(): Promise<{
    totalKeys: number;
    totalSize: number;
    keyDetails: Array<{key: string; size: number}>;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      const keyDetails = keyValuePairs.map(([key, value]) => {
        const size = value ? new Blob([value]).size : 0;
        totalSize += size;
        return {key, size};
      });

      return {
        totalKeys: keys.length,
        totalSize,
        keyDetails,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw new Error('ストレージ情報の取得に失敗しました');
    }
  }

  async migrateDataIfNeeded(): Promise<void> {
    try {
      const currentVersion = '1.0';
      const storedVersion = await AsyncStorage.getItem('DATA_VERSION');
      
      if (storedVersion !== currentVersion) {
        await this.performDataMigration(storedVersion, currentVersion);
        await AsyncStorage.setItem('DATA_VERSION', currentVersion);
      }
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }

  private async performDataMigration(fromVersion: string | null, toVersion: string): Promise<void> {
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
    
    if (!fromVersion) {
      return;
    }

    switch (fromVersion) {
      case '0.9':
        await this.migrateFromV09();
        break;
      default:
        console.log('No migration needed');
        break;
    }
  }

  private async migrateFromV09(): Promise<void> {
    console.log('Migrating from version 0.9');
  }

  async createBackup(): Promise<void> {
    try {
      const exportData = await this.exportData();
      const backupKey = `BACKUP_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, exportData);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('バックアップの作成に失敗しました');
    }
  }

  async restoreFromBackup(backupKey: string): Promise<void> {
    try {
      const backupData = await AsyncStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('バックアップデータが見つかりません');
      }

      await this.importData(backupData);
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      if (error instanceof Error && error.message === 'バックアップデータが見つかりません') {
        throw error;
      }
      throw new Error('バックアップからの復元に失敗しました');
    }
  }

  async getAvailableBackups(): Promise<Array<{key: string; date: string}>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('BACKUP_'));
      
      return backupKeys.map(key => {
        const timestamp = key.replace('BACKUP_', '');
        const date = new Date(parseInt(timestamp)).toISOString();
        return {key, date};
      });
    } catch (error) {
      console.error('Failed to get available backups:', error);
      return [];
    }
  }
}

export const storageService: StorageService = new StorageServiceImpl();