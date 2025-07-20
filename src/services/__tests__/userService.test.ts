import {userService} from '../userService';
import {UserProfile, UserPreferences} from '../../types/User';
import {CharacterType} from '../../types/Character';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockAsyncStorage = require('@react-native-async-storage/async-storage');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should load user profile from storage', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockProfile));

      const result = await userService.getUserProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('userProfile');
    });

    it('should return null if no profile exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await userService.getUserProfile('user-123');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      await expect(userService.getUserProfile()).rejects.toThrow();
    });
  });

  describe('saveUserProfile', () => {
    it('should save user profile to storage', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await userService.saveUserProfile(mockProfile);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'userProfile',
        JSON.stringify(mockProfile)
      );
    });

    it('should handle storage errors', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(userService.saveUserProfile(mockProfile)).rejects.toThrow(
        'Storage error'
      );
    });
  });

  describe('getUserPreferences', () => {
    it('should load user preferences from storage', async () => {
      const mockPreferences: UserPreferences = {
        theme: 'dark',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: false,
        autoSave: true,
        fontSize: 'large',
        animationSpeed: 'fast',
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockPreferences));

      const result = await userService.getUserPreferences();

      expect(result).toEqual(mockPreferences);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('userPreferences');
    });

    it('should return default preferences if none exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await userService.getUserPreferences();

      expect(result).toEqual({
        theme: 'light',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: true,
        autoSave: true,
        fontSize: 'medium',
        animationSpeed: 'normal',
      });
    });
  });

  describe('saveUserPreferences', () => {
    it('should save user preferences to storage', async () => {
      const mockPreferences: UserPreferences = {
        theme: 'dark',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: false,
        autoSave: true,
        fontSize: 'large',
        animationSpeed: 'fast',
      };

      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await userService.saveUserPreferences(mockPreferences);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'userPreferences',
        JSON.stringify(mockPreferences)
      );
    });
  });

  describe('syncUserData', () => {
    it('should sync user data with server', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      const mockPreferences: UserPreferences = {
        theme: 'dark',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: false,
        autoSave: true,
        fontSize: 'large',
        animationSpeed: 'fast',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({success: true}),
      });

      const result = await userService.syncUserData(mockProfile, mockPreferences);

      expect(result).toEqual({success: true});
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/sync'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('user-123'),
        })
      );
    });

    it('should handle sync errors', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      const mockPreferences: UserPreferences = {
        theme: 'light',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: true,
        autoSave: true,
        fontSize: 'medium',
        animationSpeed: 'normal',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        userService.syncUserData(mockProfile, mockPreferences)
      ).rejects.toThrow('Failed to sync user data: 500 Internal Server Error');
    });
  });

  describe('getUserStats', () => {
    it('should fetch user stats from server', async () => {
      const mockStats = {
        totalDialogues: 50,
        totalMessages: 1000,
        favoriteCharacterUsage: {
          aoi: 30,
          shun: 20,
        },
        averageDialogueLength: 20,
        longestDialogue: 100,
        mostUsedEmotions: {
          happy: 300,
          neutral: 500,
          sad: 200,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await userService.getUserStats('user-123');

      expect(result).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/user-123/stats'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle stats fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(userService.getUserStats('user-123')).rejects.toThrow(
        'Failed to fetch user stats: 404 Not Found'
      );
    });
  });

  describe('getFavoriteCharacters', () => {
    it('should load favorite characters from storage', async () => {
      const mockFavorites: CharacterType[] = ['aoi', 'shun'];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockFavorites));

      const result = await userService.getFavoriteCharacters();

      expect(result).toEqual(mockFavorites);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('favoriteCharacters');
    });

    it('should return empty array if no favorites exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await userService.getFavoriteCharacters();

      expect(result).toEqual([]);
    });
  });

  describe('saveFavoriteCharacters', () => {
    it('should save favorite characters to storage', async () => {
      const mockFavorites: CharacterType[] = ['aoi', 'shun'];

      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await userService.saveFavoriteCharacters(mockFavorites);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'favoriteCharacters',
        JSON.stringify(mockFavorites)
      );
    });
  });

  describe('clearUserData', () => {
    it('should clear all user data from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      await userService.clearUserData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userProfile');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userPreferences');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('favoriteCharacters');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('dialogueHistory');
    });

    it('should handle clear errors gracefully', async () => {
      mockAsyncStorage.removeItem
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Clear error'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Should not throw even if one removal fails
      await expect(userService.clearUserData()).resolves.not.toThrow();
    });
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      const mockPreferences: UserPreferences = {
        theme: 'dark',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: false,
        autoSave: true,
        fontSize: 'large',
        animationSpeed: 'fast',
      };

      const mockFavorites: CharacterType[] = ['aoi', 'shun'];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockProfile))
        .mockResolvedValueOnce(JSON.stringify(mockPreferences))
        .mockResolvedValueOnce(JSON.stringify(mockFavorites))
        .mockResolvedValueOnce(JSON.stringify([]));

      const result = await userService.exportUserData();

      expect(result).toEqual({
        profile: mockProfile,
        preferences: mockPreferences,
        favoriteCharacters: mockFavorites,
        dialogueHistory: [],
        exportTimestamp: expect.any(Number),
      });
    });
  });

  describe('importUserData', () => {
    it('should import user data', async () => {
      const mockData = {
        profile: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'avatar.jpg',
          createdAt: Date.now() - 86400000,
          lastActiveAt: Date.now(),
        },
        preferences: {
          theme: 'dark',
          language: 'ja',
          voiceEnabled: true,
          notificationsEnabled: false,
          autoSave: true,
          fontSize: 'large',
          animationSpeed: 'fast',
        },
        favoriteCharacters: ['aoi', 'shun'] as CharacterType[],
        dialogueHistory: [],
        exportTimestamp: Date.now(),
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await userService.importUserData(mockData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'userProfile',
        JSON.stringify(mockData.profile)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'userPreferences',
        JSON.stringify(mockData.preferences)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'favoriteCharacters',
        JSON.stringify(mockData.favoriteCharacters)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'dialogueHistory',
        JSON.stringify(mockData.dialogueHistory)
      );
    });

    it('should handle import errors', async () => {
      const mockData = {
        profile: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'avatar.jpg',
          createdAt: Date.now() - 86400000,
          lastActiveAt: Date.now(),
        },
        preferences: {
          theme: 'dark',
          language: 'ja',
          voiceEnabled: true,
          notificationsEnabled: false,
          autoSave: true,
          fontSize: 'large',
          animationSpeed: 'fast',
        },
        favoriteCharacters: ['aoi', 'shun'] as CharacterType[],
        dialogueHistory: [],
        exportTimestamp: Date.now(),
      };

      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Import error'));

      await expect(userService.importUserData(mockData)).rejects.toThrow(
        'Import error'
      );
    });
  });

  describe('updateLastActiveTime', () => {
    it('should update last active time', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: Date.now() - 86400000,
        lastActiveAt: Date.now() - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockProfile));
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await userService.updateLastActiveTime();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'userProfile',
        expect.stringContaining('"lastActiveAt":')
      );
    });

    it('should handle missing profile gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      // Should not throw error
      await expect(userService.updateLastActiveTime()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('AsyncStorage error'));

      await expect(userService.getUserProfile()).rejects.toThrow(
        'AsyncStorage error'
      );
    });

    it('should handle network errors during sync', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      const mockPreferences: UserPreferences = {
        theme: 'light',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: true,
        autoSave: true,
        fontSize: 'medium',
        animationSpeed: 'normal',
      };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        userService.syncUserData(mockProfile, mockPreferences)
      ).rejects.toThrow('Network error');
    });
  });

  describe('data validation', () => {
    it('should validate profile data before saving', async () => {
      const invalidProfile = {
        id: '', // Invalid empty ID
        name: 'Test User',
        email: 'invalid-email', // Invalid email format
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(),
      };

      await expect(
        userService.saveUserProfile(invalidProfile as UserProfile)
      ).rejects.toThrow('Invalid profile data');
    });

    it('should validate preferences data before saving', async () => {
      const invalidPreferences = {
        theme: 'invalid-theme', // Invalid theme
        language: 'ja',
        voiceEnabled: 'not-boolean', // Invalid boolean
        notificationsEnabled: true,
        autoSave: true,
        fontSize: 'medium',
        animationSpeed: 'normal',
      };

      await expect(
        userService.saveUserPreferences(invalidPreferences as any)
      ).rejects.toThrow('Invalid preferences data');
    });
  });
});