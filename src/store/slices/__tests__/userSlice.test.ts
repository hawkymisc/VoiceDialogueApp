import userReducer, {
  updateUserProfile,
  updateUserPreferences,
  addFavoriteConversation,
  removeFavoriteConversation,
  updateStatistics,
  clearUserError,
  setAuthenticated,
  updatePreferences,
  unlockContent,
  incrementConversationCount,
  updateLastActiveDate,
  resetUserState,
} from '../userSlice';
import {UserState, UserProfile, UserPreferences} from '../../../types/User';
import {CharacterType} from '../../../types/Character';

describe('userSlice', () => {
  const initialState: UserState = {
    profile: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    favoriteConversations: [],
    unlockedContent: [],
  };

  const mockProfile: UserProfile = {
    id: 'user-123',
    username: 'test_user',
    email: 'test@example.com',
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date(),
    preferences: {
      favoriteScenarios: ['daily'],
      characterCustomizations: {
        aoi: {},
        shun: {},
      } as Record<CharacterType, Partial<any>>,
      audioSettings: {
        volume: 80,
        speed: 1.0,
        autoPlay: true,
        enableSoundEffects: true,
        preferredVoiceQuality: 'standard',
      },
      privacySettings: {
        shareConversations: false,
        allowDataCollection: true,
        showOnlineStatus: true,
        enableAnalytics: true,
        ageVerified: true,
      },
      relationshipSettings: {
        aoi: {
          type: 'strangers',
          intimacyLevel: 0,
          trustLevel: 0,
        },
        shun: {
          type: 'strangers',
          intimacyLevel: 0,
          trustLevel: 0,
        },
      },
      language: 'ja',
      theme: 'light',
      voiceEnabled: true,
      notificationsEnabled: true,
      autoSave: true,
      fontSize: 'medium',
      animationSpeed: 'normal',
    },
    statistics: {
      totalConversations: 0,
      favoriteCharacter: null,
      averageSessionLength: 0,
      lastActiveDate: new Date(),
      totalPlayTime: 0,
      conversationsByScenario: {
        daily: 0,
        work: 0,
        romance: 0,
        comedy: 0,
        drama: 0,
        special: 0,
      },
      favoriteEmotions: [],
      achievementCount: 0,
    },
    subscriptionTier: 'free',
    isActive: true,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('updateUserProfile', () => {
    it('should handle fulfilled update user profile action', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const updatedProfile: UserProfile = {
        ...mockProfile,
        username: 'updated_user',
        email: 'updated@example.com',
      };

      const action = {
        type: updateUserProfile.fulfilled.type,
        payload: updatedProfile,
      };

      const actual = userReducer(stateWithProfile, action);

      expect(actual.profile?.username).toBe('updated_user');
      expect(actual.profile?.email).toBe('updated@example.com');
      expect(actual.isLoading).toBe(false);
    });

    it('should handle pending update user profile action', () => {
      const action = {
        type: updateUserProfile.pending.type,
      };

      const actual = userReducer(initialState, action);

      expect(actual.isLoading).toBe(true);
      expect(actual.error).toBeNull();
    });

    it('should handle rejected update user profile action', () => {
      const action = {
        type: updateUserProfile.rejected.type,
        payload: 'Update failed',
      };

      const actual = userReducer(initialState, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBe('Update failed');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const preferencesUpdate: Partial<UserPreferences> = {
        theme: 'dark',
        voiceEnabled: false,
        fontSize: 'large',
      };

      const actual = userReducer(stateWithProfile, updatePreferences(preferencesUpdate));

      expect(actual.profile?.preferences.theme).toBe('dark');
      expect(actual.profile?.preferences.voiceEnabled).toBe(false);
      expect(actual.profile?.preferences.fontSize).toBe('large');
      expect(actual.profile?.preferences.language).toBe('ja'); // Should preserve other fields
    });

    it('should handle async updateUserPreferences fulfilled', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const updatedPreferences: UserPreferences = {
        ...mockProfile.preferences,
        theme: 'dark',
        voiceEnabled: false,
      };

      const action = {
        type: updateUserPreferences.fulfilled.type,
        payload: updatedPreferences,
      };

      const actual = userReducer(stateWithProfile, action);

      expect(actual.profile?.preferences).toEqual(updatedPreferences);
    });
  });

  describe('addFavoriteConversation', () => {
    it('should add conversation to favorites', () => {
      const conversationId = 'conv-123';
      const actual = userReducer(initialState, addFavoriteConversation(conversationId));

      expect(actual.favoriteConversations).toContain(conversationId);
      expect(actual.favoriteConversations).toHaveLength(1);
    });

    it('should not add duplicate conversation to favorites', () => {
      const stateWithFavorite = {
        ...initialState,
        favoriteConversations: ['conv-123'],
      };

      const actual = userReducer(stateWithFavorite, addFavoriteConversation('conv-123'));

      expect(actual.favoriteConversations).toHaveLength(1);
      expect(actual.favoriteConversations).toContain('conv-123');
    });
  });

  describe('removeFavoriteConversation', () => {
    it('should remove conversation from favorites', () => {
      const stateWithFavorites = {
        ...initialState,
        favoriteConversations: ['conv-123', 'conv-456'],
      };

      const actual = userReducer(stateWithFavorites, removeFavoriteConversation('conv-123'));

      expect(actual.favoriteConversations).toHaveLength(1);
      expect(actual.favoriteConversations).toContain('conv-456');
      expect(actual.favoriteConversations).not.toContain('conv-123');
    });

    it('should handle removing non-existent conversation', () => {
      const stateWithOneFavorite = {
        ...initialState,
        favoriteConversations: ['conv-123'],
      };

      const actual = userReducer(stateWithOneFavorite, removeFavoriteConversation('conv-999'));

      expect(actual.favoriteConversations).toHaveLength(1);
      expect(actual.favoriteConversations).toContain('conv-123');
    });
  });

  describe('unlockContent', () => {
    it('should unlock content', () => {
      const contentId = 'content-123';
      const actual = userReducer(initialState, unlockContent(contentId));

      expect(actual.unlockedContent).toContain(contentId);
      expect(actual.unlockedContent).toHaveLength(1);
    });

    it('should not add duplicate content', () => {
      const stateWithUnlocked = {
        ...initialState,
        unlockedContent: ['content-123'],
      };

      const actual = userReducer(stateWithUnlocked, unlockContent('content-123'));

      expect(actual.unlockedContent).toHaveLength(1);
      expect(actual.unlockedContent).toContain('content-123');
    });
  });

  describe('setAuthenticated', () => {
    it('should set authentication status', () => {
      const actual = userReducer(initialState, setAuthenticated(true));

      expect(actual.isAuthenticated).toBe(true);
    });

    it('should clear authentication status', () => {
      const authenticatedState = {
        ...initialState,
        isAuthenticated: true,
      };

      const actual = userReducer(authenticatedState, setAuthenticated(false));

      expect(actual.isAuthenticated).toBe(false);
    });
  });

  describe('updateStatistics', () => {
    it('should update user statistics', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const statsUpdate = {
        totalConversations: 5,
        totalPlayTime: 100,
        averageSessionLength: 20,
      };

      const actual = userReducer(stateWithProfile, updateStatistics(statsUpdate));

      expect(actual.profile?.statistics.totalConversations).toBe(5);
      expect(actual.profile?.statistics.totalPlayTime).toBe(100);
      expect(actual.profile?.statistics.averageSessionLength).toBe(20);
      expect(actual.profile?.statistics.achievementCount).toBe(0); // Should preserve other fields
    });

    it('should not update statistics if no profile', () => {
      const statsUpdate = {
        totalConversations: 5,
      };

      const actual = userReducer(initialState, updateStatistics(statsUpdate));

      expect(actual.profile).toBeNull();
    });
  });

  describe('incrementConversationCount', () => {
    it('should increment conversation count', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const actual = userReducer(stateWithProfile, incrementConversationCount());

      expect(actual.profile?.statistics.totalConversations).toBe(1);
    });

    it('should not increment if no profile', () => {
      const actual = userReducer(initialState, incrementConversationCount());

      expect(actual.profile).toBeNull();
    });
  });

  describe('updateLastActiveDate', () => {
    it('should update last active date', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const actual = userReducer(stateWithProfile, updateLastActiveDate());

      expect(actual.profile?.statistics.lastActiveDate).toBeInstanceOf(Date);
      expect(actual.profile?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should not update if no profile', () => {
      const actual = userReducer(initialState, updateLastActiveDate());

      expect(actual.profile).toBeNull();
    });
  });

  describe('clearUserError', () => {
    it('should clear error state', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };

      const actual = userReducer(stateWithError, clearUserError());

      expect(actual.error).toBeNull();
    });
  });

  describe('resetUserState', () => {
    it('should reset user state to initial state', () => {
      const stateWithData = {
        ...initialState,
        profile: mockProfile,
        isAuthenticated: true,
        favoriteConversations: ['conv-1', 'conv-2'],
        unlockedContent: ['content-1'],
      };

      const actual = userReducer(stateWithData, resetUserState());

      expect(actual).toEqual(initialState);
    });
  });

  describe('async actions', () => {
    it('should handle login user fulfilled', () => {
      const loginData = {
        user: mockProfile,
        token: 'auth-token',
      };

      const action = {
        type: 'user/login/fulfilled',
        payload: loginData,
      };

      const actual = userReducer(initialState, action);

      expect(actual.profile).toEqual(mockProfile);
      expect(actual.isAuthenticated).toBe(true);
      expect(actual.isLoading).toBe(false);
    });

    it('should handle logout user fulfilled', () => {
      const stateWithUser = {
        ...initialState,
        profile: mockProfile,
        isAuthenticated: true,
        favoriteConversations: ['conv-1'],
        unlockedContent: ['content-1'],
      };

      const action = {
        type: 'user/logout/fulfilled',
        payload: true,
      };

      const actual = userReducer(stateWithUser, action);

      expect(actual.profile).toBeNull();
      expect(actual.isAuthenticated).toBe(false);
      expect(actual.favoriteConversations).toEqual([]);
      expect(actual.unlockedContent).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle profile fetch errors', () => {
      const action = {
        type: 'user/fetchProfile/rejected',
        payload: 'Profile fetch failed',
      };

      const actual = userReducer(initialState, action);

      expect(actual.error).toBe('Profile fetch failed');
      expect(actual.isLoading).toBe(false);
      expect(actual.isAuthenticated).toBe(false);
    });

    it('should handle login errors', () => {
      const action = {
        type: 'user/login/rejected',
        payload: 'Invalid credentials',
      };

      const actual = userReducer(initialState, action);

      expect(actual.error).toBe('Invalid credentials');
      expect(actual.isLoading).toBe(false);
      expect(actual.isAuthenticated).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty favorite conversations', () => {
      expect(initialState.favoriteConversations).toHaveLength(0);
    });

    it('should handle empty unlocked content', () => {
      expect(initialState.unlockedContent).toHaveLength(0);
    });

    it('should handle actions when profile is null', () => {
      const actions = [
        updatePreferences({theme: 'dark'}),
        updateStatistics({totalConversations: 1}),
        incrementConversationCount(),
        updateLastActiveDate(),
      ];

      actions.forEach(action => {
        const actual = userReducer(initialState, action);
        expect(actual.profile).toBeNull();
      });
    });

    it('should handle stats with zero values', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockProfile,
      };

      const statsUpdate = {
        totalConversations: 0,
        totalPlayTime: 0,
        averageSessionLength: 0,
      };

      const actual = userReducer(stateWithProfile, updateStatistics(statsUpdate));

      expect(actual.profile?.statistics.totalConversations).toBe(0);
      expect(actual.profile?.statistics.totalPlayTime).toBe(0);
      expect(actual.profile?.statistics.averageSessionLength).toBe(0);
    });

    it('should handle large favorite conversations list', () => {
      let state = initialState;
      
      for (let i = 0; i < 1000; i++) {
        state = userReducer(state, addFavoriteConversation(`conv-${i}`));
      }

      expect(state.favoriteConversations).toHaveLength(1000);
      expect(state.favoriteConversations[999]).toBe('conv-999');
    });
  });
});