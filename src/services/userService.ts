import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserProfile, UserPreferences, UserStatistics} from '../types/User';
import {CharacterType} from '../types/Character';

export interface UserService {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>;
  getUserStatistics(userId: string): Promise<UserStatistics | null>;
  updateUserStatistics(userId: string, stats: Partial<UserStatistics>): Promise<void>;
  deleteUserData(userId: string): Promise<void>;
}

class UserServiceImpl implements UserService {
  private readonly STORAGE_KEYS = {
    PROFILE: (userId: string) => `user_profile_${userId}`,
    PREFERENCES: (userId: string) => `user_preferences_${userId}`,
    STATISTICS: (userId: string) => `user_statistics_${userId}`,
  };

  private readonly DEFAULT_PREFERENCES: UserPreferences = {
    favoriteScenarios: [],
    characterCustomizations: {},
    audioSettings: {
      volume: 80,
      speed: 1.0,
      autoPlay: true,
      enableSoundEffects: true,
      preferredVoiceQuality: 'high',
    },
    privacySettings: {
      shareConversations: false,
      allowDataCollection: true,
      showOnlineStatus: false,
      enableAnalytics: true,
      ageVerified: false,
    },
    relationshipSettings: {},
    language: 'ja',
    theme: 'light',
  };

  private readonly DEFAULT_STATISTICS: UserStatistics = {
    totalConversations: 0,
    favoriteCharacter: null,
    averageSessionLength: 0,
    lastActiveDate: new Date(),
    totalPlayTime: 0,
    conversationsByScenario: {},
    favoriteEmotions: [],
    achievementCount: 0,
  };

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.STORAGE_KEYS.PROFILE(userId));
      
      if (!profileData) {
        return null;
      }

      const profile = JSON.parse(profileData);
      
      // Convert string dates back to Date objects
      profile.createdAt = new Date(profile.createdAt);
      profile.lastLoginAt = new Date(profile.lastLoginAt);
      profile.statistics.lastActiveDate = new Date(profile.statistics.lastActiveDate);

      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Create new user profile
   */
  async createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const now = new Date();
      
      const profile: UserProfile = {
        id: userId,
        username: profileData.username,
        email: profileData.email,
        createdAt: now,
        lastLoginAt: now,
        preferences: {...this.DEFAULT_PREFERENCES, ...profileData.preferences},
        statistics: {...this.DEFAULT_STATISTICS, ...profileData.statistics},
        subscriptionTier: profileData.subscriptionTier || 'free',
        isActive: true,
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PROFILE(userId),
        JSON.stringify(profile)
      );

      return profile;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const existingProfile = await this.getUserProfile(userId);
      
      if (!existingProfile) {
        throw new Error('User profile not found');
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        id: userId, // Ensure ID doesn't change
        lastLoginAt: new Date(), // Update last login
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PROFILE(userId),
        JSON.stringify(updatedProfile)
      );

      return updatedProfile;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const preferencesData = await AsyncStorage.getItem(this.STORAGE_KEYS.PREFERENCES(userId));
      
      if (!preferencesData) {
        // Return default preferences if none exist
        return this.DEFAULT_PREFERENCES;
      }

      return JSON.parse(preferencesData);
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return this.DEFAULT_PREFERENCES;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const existingPreferences = await this.getUserPreferences(userId);
      
      const updatedPreferences: UserPreferences = {
        ...existingPreferences!,
        ...preferences,
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PREFERENCES(userId),
        JSON.stringify(updatedPreferences)
      );
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    try {
      const statisticsData = await AsyncStorage.getItem(this.STORAGE_KEYS.STATISTICS(userId));
      
      if (!statisticsData) {
        return this.DEFAULT_STATISTICS;
      }

      const statistics = JSON.parse(statisticsData);
      
      // Convert string dates back to Date objects
      statistics.lastActiveDate = new Date(statistics.lastActiveDate);

      return statistics;
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      return this.DEFAULT_STATISTICS;
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStatistics(userId: string, stats: Partial<UserStatistics>): Promise<void> {
    try {
      const existingStats = await this.getUserStatistics(userId);
      
      const updatedStats: UserStatistics = {
        ...existingStats!,
        ...stats,
        lastActiveDate: new Date(), // Always update last active date
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.STATISTICS(userId),
        JSON.stringify(updatedStats)
      );
    } catch (error) {
      console.error('Failed to update user statistics:', error);
      throw new Error('Failed to update user statistics');
    }
  }

  /**
   * Delete all user data
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.PROFILE(userId)),
        AsyncStorage.removeItem(this.STORAGE_KEYS.PREFERENCES(userId)),
        AsyncStorage.removeItem(this.STORAGE_KEYS.STATISTICS(userId)),
      ]);
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Initialize user if not exists
   */
  async initializeUser(userId: string): Promise<UserProfile> {
    try {
      let profile = await this.getUserProfile(userId);
      
      if (!profile) {
        profile = await this.createUserProfile(userId, {
          username: `User${userId.substring(0, 6)}`,
        });
      } else {
        // Update last login
        profile = await this.updateUserProfile(userId, {});
      }

      return profile;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw new Error('Failed to initialize user');
    }
  }

  /**
   * Track conversation completion
   */
  async trackConversation(userId: string, characterId: CharacterType, duration: number): Promise<void> {
    try {
      const stats = await this.getUserStatistics(userId);
      
      if (stats) {
        const updatedStats: Partial<UserStatistics> = {
          totalConversations: stats.totalConversations + 1,
          totalPlayTime: stats.totalPlayTime + duration,
          conversationsByScenario: {
            ...stats.conversationsByScenario,
            // This would be more specific with actual scenario tracking
          },
        };

        // Update favorite character based on usage
        if (!stats.favoriteCharacter) {
          updatedStats.favoriteCharacter = characterId;
        }

        await this.updateUserStatistics(userId, updatedStats);
      }
    } catch (error) {
      console.error('Failed to track conversation:', error);
      // Don't throw error as this is not critical functionality
    }
  }

  /**
   * Get user data for export
   */
  async exportUserData(userId: string): Promise<{
    profile: UserProfile | null;
    preferences: UserPreferences | null;
    statistics: UserStatistics | null;
  }> {
    try {
      const [profile, preferences, statistics] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getUserStatistics(userId),
      ]);

      return {
        profile,
        preferences,
        statistics,
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }
}

// Export singleton instance
export const userService = new UserServiceImpl();
export default userService;
