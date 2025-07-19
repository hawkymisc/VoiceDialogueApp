import AsyncStorage from '@react-native-async-storage/async-storage';
import {storageService} from '../storageService';
import {UserProfile, UserPreferences} from '../../types/User';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  clear: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('StorageService', () => {
  const mockUserProfile: UserProfile = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2023-01-02T00:00:00.000Z'),
    preferences: {
      favoriteScenarios: ['daily'],
      characterCustomizations: {
        aoi: {},
        shun: {},
      },
      audioSettings: {
        volume: 80,
        speed: 1.0,
        autoPlay: true,
        enableSoundEffects: true,
        preferredVoiceQuality: 'standard',
      },
      privacySettings: {
        shareConversations: false,
        allowDataCollection: false,
        showOnlineStatus: true,
        enableAnalytics: false,
        ageVerified: false,
      },
      relationshipSettings: {
        aoi: {
          relationshipType: '友達',
          intimacyLevel: 0,
          personalityTraits: {
            aggressiveness: 5,
            kindness: 8,
            tsundere: 3,
            shyness: 7,
          },
        },
        shun: {
          relationshipType: '先輩',
          intimacyLevel: 0,
          personalityTraits: {
            aggressiveness: 3,
            kindness: 9,
            tsundere: 2,
            shyness: 4,
          },
        },
      },
      language: 'ja',
      theme: 'light',
    },
    statistics: {
      totalConversations: 10,
      favoriteCharacter: 'aoi',
      averageSessionLength: 15,
      lastActiveDate: new Date('2023-01-03T00:00:00.000Z'),
      totalPlayTime: 150,
      conversationsByScenario: {
        daily: 5,
        work: 3,
        special: 2,
      },
      favoriteEmotions: ['happy', 'neutral'],
      achievementCount: 5,
    },
    subscriptionTier: 'premium',
    isActive: true,
  };

  const mockUserPreferences: UserPreferences = mockUserProfile.preferences;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Profile Operations', () => {
    describe('saveUserProfile', () => {
      it('should save user profile successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.saveUserProfile(mockUserProfile);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'USER_PROFILE',
          expect.stringContaining('"id":"test-user-id"')
        );
      });

      it('should serialize dates correctly when saving', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.saveUserProfile(mockUserProfile);

        const savedData = (mockAsyncStorage.setItem as jest.Mock).mock.calls[0][1];
        const parsedData = JSON.parse(savedData);

        expect(parsedData.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(parsedData.lastLoginAt).toBe('2023-01-02T00:00:00.000Z');
        expect(parsedData.statistics.lastActiveDate).toBe('2023-01-03T00:00:00.000Z');
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.saveUserProfile(mockUserProfile))
          .rejects.toThrow('ユーザープロファイルの保存に失敗しました');
      });
    });

    describe('getUserProfile', () => {
      it('should retrieve user profile successfully', async () => {
        const serializedProfile = JSON.stringify({
          ...mockUserProfile,
          createdAt: mockUserProfile.createdAt.toISOString(),
          lastLoginAt: mockUserProfile.lastLoginAt.toISOString(),
          statistics: {
            ...mockUserProfile.statistics,
            lastActiveDate: mockUserProfile.statistics.lastActiveDate.toISOString(),
          },
        });

        mockAsyncStorage.getItem.mockResolvedValue(serializedProfile);

        const result = await storageService.getUserProfile();

        expect(result).toEqual(expect.objectContaining({
          id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
        }));
        expect(result?.createdAt).toBeInstanceOf(Date);
        expect(result?.lastLoginAt).toBeInstanceOf(Date);
        expect(result?.statistics.lastActiveDate).toBeInstanceOf(Date);
      });

      it('should return null when no profile exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await storageService.getUserProfile();

        expect(result).toBeNull();
      });

      it('should handle corrupted data gracefully', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('invalid json');

        const result = await storageService.getUserProfile();

        expect(result).toBeNull();
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await storageService.getUserProfile();

        expect(result).toBeNull();
      });
    });
  });

  describe('User Preferences Operations', () => {
    describe('saveUserPreferences', () => {
      it('should save user preferences successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.saveUserPreferences(mockUserPreferences);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'USER_PREFERENCES',
          JSON.stringify(mockUserPreferences)
        );
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.saveUserPreferences(mockUserPreferences))
          .rejects.toThrow('ユーザー設定の保存に失敗しました');
      });
    });

    describe('getUserPreferences', () => {
      it('should retrieve user preferences successfully', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUserPreferences));

        const result = await storageService.getUserPreferences();

        expect(result).toEqual(mockUserPreferences);
      });

      it('should return null when no preferences exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await storageService.getUserPreferences();

        expect(result).toBeNull();
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await storageService.getUserPreferences();

        expect(result).toBeNull();
      });
    });
  });

  describe('Favorite Conversations Operations', () => {
    const mockConversationIds = ['conv1', 'conv2', 'conv3'];

    describe('saveFavoriteConversations', () => {
      it('should save favorite conversations successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.saveFavoriteConversations(mockConversationIds);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'FAVORITE_CONVERSATIONS',
          JSON.stringify(mockConversationIds)
        );
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.saveFavoriteConversations(mockConversationIds))
          .rejects.toThrow('お気に入り会話の保存に失敗しました');
      });
    });

    describe('getFavoriteConversations', () => {
      it('should retrieve favorite conversations successfully', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockConversationIds));

        const result = await storageService.getFavoriteConversations();

        expect(result).toEqual(mockConversationIds);
      });

      it('should return empty array when no conversations exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await storageService.getFavoriteConversations();

        expect(result).toEqual([]);
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await storageService.getFavoriteConversations();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Unlocked Content Operations', () => {
    const mockContentIds = ['content1', 'content2', 'content3'];

    describe('saveUnlockedContent', () => {
      it('should save unlocked content successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.saveUnlockedContent(mockContentIds);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'UNLOCKED_CONTENT',
          JSON.stringify(mockContentIds)
        );
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.saveUnlockedContent(mockContentIds))
          .rejects.toThrow('アンロックコンテンツの保存に失敗しました');
      });
    });

    describe('getUnlockedContent', () => {
      it('should retrieve unlocked content successfully', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockContentIds));

        const result = await storageService.getUnlockedContent();

        expect(result).toEqual(mockContentIds);
      });

      it('should return empty array when no content exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await storageService.getUnlockedContent();

        expect(result).toEqual([]);
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await storageService.getUnlockedContent();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Data Management Operations', () => {
    describe('clearAllData', () => {
      it('should clear all data successfully', async () => {
        mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

        await storageService.clearAllData();

        expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
          'USER_PROFILE',
          'USER_PREFERENCES',
          'FAVORITE_CONVERSATIONS',
          'UNLOCKED_CONTENT',
          'CONVERSATION_HISTORY',
          'USER_STATISTICS',
          'LAST_BACKUP',
        ]);
      });

      it('should handle clear error', async () => {
        mockAsyncStorage.multiRemove.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.clearAllData())
          .rejects.toThrow('データの削除に失敗しました');
      });
    });

    describe('exportData', () => {
      it('should export data successfully', async () => {
        const mockKeyValuePairs = [
          ['USER_PROFILE', JSON.stringify(mockUserProfile)],
          ['USER_PREFERENCES', JSON.stringify(mockUserPreferences)],
          ['FAVORITE_CONVERSATIONS', JSON.stringify(['conv1', 'conv2'])],
          ['UNLOCKED_CONTENT', JSON.stringify(['content1'])],
        ];

        mockAsyncStorage.multiGet.mockResolvedValue(mockKeyValuePairs);

        const result = await storageService.exportData();

        const parsedResult = JSON.parse(result);
        expect(parsedResult.USER_PROFILE).toBeDefined();
        expect(parsedResult.USER_PREFERENCES).toBeDefined();
        expect(parsedResult.FAVORITE_CONVERSATIONS).toBeDefined();
        expect(parsedResult.UNLOCKED_CONTENT).toBeDefined();
        expect(parsedResult.exportDate).toBeDefined();
        expect(parsedResult.version).toBe('1.0');
      });

      it('should handle export error', async () => {
        mockAsyncStorage.multiGet.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.exportData())
          .rejects.toThrow('データのエクスポートに失敗しました');
      });
    });

    describe('importData', () => {
      it('should import data successfully', async () => {
        const exportData = {
          USER_PROFILE: mockUserProfile,
          USER_PREFERENCES: mockUserPreferences,
          FAVORITE_CONVERSATIONS: ['conv1', 'conv2'],
          UNLOCKED_CONTENT: ['content1'],
          exportDate: '2023-01-01T00:00:00.000Z',
          version: '1.0',
        };

        mockAsyncStorage.multiSet.mockResolvedValue(undefined);

        await storageService.importData(JSON.stringify(exportData));

        expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
          ['USER_PROFILE', JSON.stringify(mockUserProfile)],
          ['USER_PREFERENCES', JSON.stringify(mockUserPreferences)],
          ['FAVORITE_CONVERSATIONS', JSON.stringify(['conv1', 'conv2'])],
          ['UNLOCKED_CONTENT', JSON.stringify(['content1'])],
        ]);
      });

      it('should handle invalid data format', async () => {
        const invalidData = {
          test: 'data',
          // missing version
        };

        await expect(storageService.importData(JSON.stringify(invalidData)))
          .rejects.toThrow('無効なデータ形式です');
      });

      it('should handle import error', async () => {
        mockAsyncStorage.multiSet.mockRejectedValue(new Error('Storage error'));

        const exportData = {
          USER_PROFILE: mockUserProfile,
          version: '1.0',
        };

        await expect(storageService.importData(JSON.stringify(exportData)))
          .rejects.toThrow('データのインポートに失敗しました');
      });

      it('should handle invalid JSON', async () => {
        await expect(storageService.importData('invalid json'))
          .rejects.toThrow('データのインポートに失敗しました');
      });
    });
  });

  describe('Storage Info Operations', () => {
    describe('getStorageInfo', () => {
      it('should get storage info successfully', async () => {
        const mockKeys = ['USER_PROFILE', 'USER_PREFERENCES', 'FAVORITE_CONVERSATIONS'];
        const mockKeyValuePairs = [
          ['USER_PROFILE', 'test data 1'],
          ['USER_PREFERENCES', 'test data 2'],
          ['FAVORITE_CONVERSATIONS', 'test data 3'],
        ];

        mockAsyncStorage.getAllKeys.mockResolvedValue(mockKeys);
        mockAsyncStorage.multiGet.mockResolvedValue(mockKeyValuePairs);

        // Mock Blob constructor
        global.Blob = jest.fn((content) => ({
          size: content[0].length,
        })) as any;

        const result = await storageService.getStorageInfo();

        expect(result.totalKeys).toBe(3);
        expect(result.totalSize).toBeGreaterThan(0);
        expect(result.keyDetails).toHaveLength(3);
      });

      it('should handle storage info error', async () => {
        mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.getStorageInfo())
          .rejects.toThrow('ストレージ情報の取得に失敗しました');
      });
    });
  });

  describe('Backup Operations', () => {
    describe('createBackup', () => {
      it('should create backup successfully', async () => {
        const mockExportData = '{"test": "data"}';
        mockAsyncStorage.multiGet.mockResolvedValue([
          ['USER_PROFILE', JSON.stringify(mockUserProfile)],
        ]);
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.createBackup();

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          expect.stringMatching(/^BACKUP_\d+$/),
          expect.any(String)
        );
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'LAST_BACKUP',
          expect.any(String)
        );
      });

      it('should handle backup creation error', async () => {
        mockAsyncStorage.multiGet.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.createBackup())
          .rejects.toThrow('バックアップの作成に失敗しました');
      });
    });

    describe('restoreFromBackup', () => {
      it('should restore from backup successfully', async () => {
        const mockBackupData = JSON.stringify({
          USER_PROFILE: mockUserProfile,
          version: '1.0',
        });

        mockAsyncStorage.getItem.mockResolvedValue(mockBackupData);
        mockAsyncStorage.multiSet.mockResolvedValue(undefined);

        await storageService.restoreFromBackup('BACKUP_123456789');

        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('BACKUP_123456789');
        expect(mockAsyncStorage.multiSet).toHaveBeenCalled();
      });

      it('should handle missing backup data', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        await expect(storageService.restoreFromBackup('BACKUP_123456789'))
          .rejects.toThrow('バックアップデータが見つかりません');
      });

      it('should handle restore error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        await expect(storageService.restoreFromBackup('BACKUP_123456789'))
          .rejects.toThrow('バックアップからの復元に失敗しました');
      });
    });

    describe('getAvailableBackups', () => {
      it('should get available backups successfully', async () => {
        const mockKeys = [
          'USER_PROFILE',
          'BACKUP_1234567890',
          'BACKUP_1234567891',
          'USER_PREFERENCES',
        ];

        mockAsyncStorage.getAllKeys.mockResolvedValue(mockKeys);

        const result = await storageService.getAvailableBackups();

        expect(result).toHaveLength(2);
        expect(result[0].key).toBe('BACKUP_1234567890');
        expect(result[1].key).toBe('BACKUP_1234567891');
        expect(result[0].date).toBeDefined();
        expect(result[1].date).toBeDefined();
      });

      it('should handle get backups error', async () => {
        mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

        const result = await storageService.getAvailableBackups();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Conversation History Operations', () => {
    const mockConversationId = 'conv-123';
    const mockHistory = [
      {id: '1', message: 'Hello', timestamp: '2023-01-01T00:00:00.000Z'},
      {id: '2', message: 'Hi there', timestamp: '2023-01-01T00:00:00.000Z'},
    ];

    describe('saveConversationHistory', () => {
      it('should save conversation history successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await (storageService as any).saveConversationHistory(mockConversationId, mockHistory);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          `CONVERSATION_HISTORY_${mockConversationId}`,
          JSON.stringify(mockHistory)
        );
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect((storageService as any).saveConversationHistory(mockConversationId, mockHistory))
          .rejects.toThrow('会話履歴の保存に失敗しました');
      });
    });

    describe('getConversationHistory', () => {
      it('should retrieve conversation history successfully', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockHistory));

        const result = await (storageService as any).getConversationHistory(mockConversationId);

        expect(result).toEqual(mockHistory);
      });

      it('should return empty array when no history exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await (storageService as any).getConversationHistory(mockConversationId);

        expect(result).toEqual([]);
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await (storageService as any).getConversationHistory(mockConversationId);

        expect(result).toEqual([]);
      });
    });
  });

  describe('User Statistics Operations', () => {
    const mockStatistics = {
      totalConversations: 10,
      favoriteCharacter: 'aoi',
      averageSessionLength: 15,
      lastActiveDate: new Date('2023-01-03T00:00:00.000Z'),
      totalPlayTime: 150,
      conversationsByScenario: {
        daily: 5,
        work: 3,
        special: 2,
      },
      favoriteEmotions: ['happy', 'neutral'],
      achievementCount: 5,
    };

    describe('saveUserStatistics', () => {
      it('should save user statistics successfully', async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await (storageService as any).saveUserStatistics(mockStatistics);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'USER_STATISTICS',
          expect.stringContaining('"lastActiveDate":"2023-01-03T00:00:00.000Z"')
        );
      });

      it('should handle save error', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

        await expect((storageService as any).saveUserStatistics(mockStatistics))
          .rejects.toThrow('ユーザー統計の保存に失敗しました');
      });
    });

    describe('getUserStatistics', () => {
      it('should retrieve user statistics successfully', async () => {
        const serializedStats = JSON.stringify({
          ...mockStatistics,
          lastActiveDate: mockStatistics.lastActiveDate.toISOString(),
        });

        mockAsyncStorage.getItem.mockResolvedValue(serializedStats);

        const result = await (storageService as any).getUserStatistics();

        expect(result).toEqual(expect.objectContaining({
          totalConversations: 10,
          favoriteCharacter: 'aoi',
          averageSessionLength: 15,
          totalPlayTime: 150,
        }));
        expect(result?.lastActiveDate).toBeInstanceOf(Date);
      });

      it('should return null when no statistics exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await (storageService as any).getUserStatistics();

        expect(result).toBeNull();
      });

      it('should handle retrieval error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const result = await (storageService as any).getUserStatistics();

        expect(result).toBeNull();
      });
    });
  });

  describe('Data Migration', () => {
    describe('migrateDataIfNeeded', () => {
      it('should perform migration when version differs', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('0.9');
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storageService.migrateDataIfNeeded();

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('DATA_VERSION', '1.0');
      });

      it('should skip migration when version matches', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('1.0');

        await storageService.migrateDataIfNeeded();

        expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith('DATA_VERSION', '1.0');
      });

      it('should handle migration error gracefully', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        // Should not throw
        await expect(storageService.migrateDataIfNeeded()).resolves.toBeUndefined();
      });
    });
  });
});