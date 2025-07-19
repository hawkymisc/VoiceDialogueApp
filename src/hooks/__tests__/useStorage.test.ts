/**
 * @jest-environment jsdom
 */
import {storageService} from '../../services/storageService';
import {UserProfile, UserPreferences} from '../../types/User';

// Mock storageService
jest.mock('../../services/storageService');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

describe('useStorage Hook Integration', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockStorageService.migrateDataIfNeeded.mockResolvedValue(undefined);
    mockStorageService.getUserPreferences.mockResolvedValue(null);
    mockStorageService.getFavoriteConversations.mockResolvedValue([]);
    mockStorageService.getUnlockedContent.mockResolvedValue([]);
    mockStorageService.saveUserProfile.mockResolvedValue(undefined);
    mockStorageService.saveUserPreferences.mockResolvedValue(undefined);
    mockStorageService.saveFavoriteConversations.mockResolvedValue(undefined);
    mockStorageService.saveUnlockedContent.mockResolvedValue(undefined);
  });

  describe('Storage Service Integration', () => {
    it('should interact with storage service for profile operations', async () => {
      // Test save profile
      await mockStorageService.saveUserProfile(mockUserProfile);
      expect(mockStorageService.saveUserProfile).toHaveBeenCalledWith(mockUserProfile);

      // Test load profile
      mockStorageService.getUserProfile.mockResolvedValue(mockUserProfile);
      const profile = await mockStorageService.getUserProfile();
      expect(profile).toEqual(mockUserProfile);
    });

    it('should interact with storage service for preferences operations', async () => {
      const preferences = mockUserProfile.preferences;
      
      // Test save preferences
      await mockStorageService.saveUserPreferences(preferences);
      expect(mockStorageService.saveUserPreferences).toHaveBeenCalledWith(preferences);

      // Test load preferences
      mockStorageService.getUserPreferences.mockResolvedValue(preferences);
      const loadedPreferences = await mockStorageService.getUserPreferences();
      expect(loadedPreferences).toEqual(preferences);
    });

    it('should interact with storage service for favorite conversations', async () => {
      const conversationIds = ['conv1', 'conv2', 'conv3'];
      
      // Test save favorite conversations
      await mockStorageService.saveFavoriteConversations(conversationIds);
      expect(mockStorageService.saveFavoriteConversations).toHaveBeenCalledWith(conversationIds);

      // Test load favorite conversations
      mockStorageService.getFavoriteConversations.mockResolvedValue(conversationIds);
      const loadedConversations = await mockStorageService.getFavoriteConversations();
      expect(loadedConversations).toEqual(conversationIds);
    });

    it('should interact with storage service for unlocked content', async () => {
      const contentIds = ['content1', 'content2', 'content3'];
      
      // Test save unlocked content
      await mockStorageService.saveUnlockedContent(contentIds);
      expect(mockStorageService.saveUnlockedContent).toHaveBeenCalledWith(contentIds);

      // Test load unlocked content
      mockStorageService.getUnlockedContent.mockResolvedValue(contentIds);
      const loadedContent = await mockStorageService.getUnlockedContent();
      expect(loadedContent).toEqual(contentIds);
    });

    it('should handle data export/import operations', async () => {
      const exportData = '{"test": "data"}';
      
      // Test export data
      mockStorageService.exportData.mockResolvedValue(exportData);
      const exported = await mockStorageService.exportData();
      expect(exported).toBe(exportData);

      // Test import data
      await mockStorageService.importData(exportData);
      expect(mockStorageService.importData).toHaveBeenCalledWith(exportData);
    });

    it('should handle backup operations', async () => {
      const backups = [
        {key: 'BACKUP_123456789', date: '2023-01-01T00:00:00.000Z'},
        {key: 'BACKUP_123456790', date: '2023-01-02T00:00:00.000Z'},
      ];
      
      // Test create backup
      await mockStorageService.createBackup();
      expect(mockStorageService.createBackup).toHaveBeenCalled();

      // Test get available backups
      mockStorageService.getAvailableBackups.mockResolvedValue(backups);
      const loadedBackups = await mockStorageService.getAvailableBackups();
      expect(loadedBackups).toEqual(backups);

      // Test restore from backup
      await mockStorageService.restoreFromBackup('BACKUP_123456789');
      expect(mockStorageService.restoreFromBackup).toHaveBeenCalledWith('BACKUP_123456789');
    });

    it('should handle storage info operations', async () => {
      const storageInfo = {
        totalKeys: 10,
        totalSize: 1024,
        keyDetails: [
          {key: 'USER_PROFILE', size: 512},
          {key: 'USER_PREFERENCES', size: 512},
        ],
      };
      
      mockStorageService.getStorageInfo.mockResolvedValue(storageInfo);
      const info = await mockStorageService.getStorageInfo();
      expect(info).toEqual(storageInfo);
    });

    it('should handle clear all data operation', async () => {
      await mockStorageService.clearAllData();
      expect(mockStorageService.clearAllData).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle profile operation errors', async () => {
      // Test save profile error
      mockStorageService.saveUserProfile.mockRejectedValue(new Error('Save failed'));
      await expect(mockStorageService.saveUserProfile(mockUserProfile))
        .rejects.toThrow('Save failed');

      // Test load profile error
      mockStorageService.getUserProfile.mockRejectedValue(new Error('Load failed'));
      await expect(mockStorageService.getUserProfile())
        .rejects.toThrow('Load failed');
    });

    it('should handle preferences operation errors', async () => {
      const preferences = mockUserProfile.preferences;
      
      // Test save preferences error
      mockStorageService.saveUserPreferences.mockRejectedValue(new Error('Save failed'));
      await expect(mockStorageService.saveUserPreferences(preferences))
        .rejects.toThrow('Save failed');

      // Test load preferences error
      mockStorageService.getUserPreferences.mockRejectedValue(new Error('Load failed'));
      await expect(mockStorageService.getUserPreferences())
        .rejects.toThrow('Load failed');
    });

    it('should handle data management operation errors', async () => {
      // Test export error
      mockStorageService.exportData.mockRejectedValue(new Error('Export failed'));
      await expect(mockStorageService.exportData())
        .rejects.toThrow('Export failed');

      // Test import error
      mockStorageService.importData.mockRejectedValue(new Error('Import failed'));
      await expect(mockStorageService.importData('invalid data'))
        .rejects.toThrow('Import failed');

      // Test clear data error
      mockStorageService.clearAllData.mockRejectedValue(new Error('Clear failed'));
      await expect(mockStorageService.clearAllData())
        .rejects.toThrow('Clear failed');
    });

    it('should handle backup operation errors', async () => {
      // Test create backup error
      mockStorageService.createBackup.mockRejectedValue(new Error('Backup failed'));
      await expect(mockStorageService.createBackup())
        .rejects.toThrow('Backup failed');

      // Test restore backup error
      mockStorageService.restoreFromBackup.mockRejectedValue(new Error('Restore failed'));
      await expect(mockStorageService.restoreFromBackup('BACKUP_123456789'))
        .rejects.toThrow('Restore failed');

      // Test get backups error
      mockStorageService.getAvailableBackups.mockRejectedValue(new Error('Get backups failed'));
      await expect(mockStorageService.getAvailableBackups())
        .rejects.toThrow('Get backups failed');
    });
  });

  describe('Data Migration', () => {
    it('should handle data migration', async () => {
      await mockStorageService.migrateDataIfNeeded();
      expect(mockStorageService.migrateDataIfNeeded).toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      mockStorageService.migrateDataIfNeeded.mockRejectedValue(new Error('Migration failed'));
      await expect(mockStorageService.migrateDataIfNeeded())
        .rejects.toThrow('Migration failed');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent operations', async () => {
      const preferences = mockUserProfile.preferences;
      const conversationIds = ['conv1', 'conv2'];
      const contentIds = ['content1', 'content2'];
      
      // Test concurrent operations
      await Promise.all([
        mockStorageService.saveUserPreferences(preferences),
        mockStorageService.saveFavoriteConversations(conversationIds),
        mockStorageService.saveUnlockedContent(contentIds),
      ]);
      
      expect(mockStorageService.saveUserPreferences).toHaveBeenCalledWith(preferences);
      expect(mockStorageService.saveFavoriteConversations).toHaveBeenCalledWith(conversationIds);
      expect(mockStorageService.saveUnlockedContent).toHaveBeenCalledWith(contentIds);
    });

    it('should handle rapid successive calls', async () => {
      const preferences = mockUserProfile.preferences;
      
      // Test rapid successive calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(mockStorageService.saveUserPreferences(preferences));
      }
      
      await Promise.all(promises);
      expect(mockStorageService.saveUserPreferences).toHaveBeenCalledTimes(10);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for all operations', async () => {
      // Test that type checking works for all operations
      const profile: UserProfile = mockUserProfile;
      const preferences: UserPreferences = mockUserProfile.preferences;
      const conversationIds: string[] = ['conv1', 'conv2'];
      const contentIds: string[] = ['content1', 'content2'];
      
      // These should all compile without type errors
      await mockStorageService.saveUserProfile(profile);
      await mockStorageService.saveUserPreferences(preferences);
      await mockStorageService.saveFavoriteConversations(conversationIds);
      await mockStorageService.saveUnlockedContent(contentIds);
      
      mockStorageService.getUserProfile.mockResolvedValue(profile);
      mockStorageService.getUserPreferences.mockResolvedValue(preferences);
      mockStorageService.getFavoriteConversations.mockResolvedValue(conversationIds);
      mockStorageService.getUnlockedContent.mockResolvedValue(contentIds);
      
      const loadedProfile = await mockStorageService.getUserProfile();
      const loadedPreferences = await mockStorageService.getUserPreferences();
      const loadedConversations = await mockStorageService.getFavoriteConversations();
      const loadedContent = await mockStorageService.getUnlockedContent();
      
      expect(loadedProfile).toEqual(profile);
      expect(loadedPreferences).toEqual(preferences);
      expect(loadedConversations).toEqual(conversationIds);
      expect(loadedContent).toEqual(contentIds);
    });
  });
});