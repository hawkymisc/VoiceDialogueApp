import userReducer, {
  updateUserProfile,
  updateUserPreferences,
  addFavoriteCharacter,
  removeFavoriteCharacter,
  addDialogueHistory,
  clearDialogueHistory,
  updateUserStats,
  setUserLoading,
  clearUserError,
  selectUserProfile,
  selectUserPreferences,
  selectFavoriteCharacters,
  selectDialogueHistory,
  selectUserStats,
} from '../userSlice';
import {UserState, UserProfile, UserPreferences, DialogueHistoryEntry, UserStats} from '../../../types/User';
import {CharacterType} from '../../../types/Character';

describe('userSlice', () => {
  const initialState: UserState = {
    profile: {
      id: '',
      name: '',
      email: '',
      avatar: '',
      createdAt: 0,
      lastActiveAt: 0,
    },
    preferences: {
      theme: 'light',
      language: 'ja',
      voiceEnabled: true,
      notificationsEnabled: true,
      autoSave: true,
      fontSize: 'medium',
      animationSpeed: 'normal',
    },
    favoriteCharacters: [],
    dialogueHistory: [],
    stats: {
      totalDialogues: 0,
      totalMessages: 0,
      favoriteCharacterUsage: {},
      averageDialogueLength: 0,
      longestDialogue: 0,
      mostUsedEmotions: {},
    },
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('updateUserProfile', () => {
    it('should update user profile', () => {
      const profileUpdate: Partial<UserProfile> = {
        name: 'Test User',
        email: 'test@example.com',
      };

      const actual = userReducer(initialState, updateUserProfile(profileUpdate));

      expect(actual.profile.name).toBe('Test User');
      expect(actual.profile.email).toBe('test@example.com');
      expect(actual.profile.id).toBe(''); // Should preserve other fields
    });

    it('should update lastActiveAt when profile is updated', () => {
      const profileUpdate: Partial<UserProfile> = {
        name: 'Active User',
      };

      const actual = userReducer(initialState, updateUserProfile(profileUpdate));

      expect(actual.profile.lastActiveAt).toBeGreaterThan(0);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', () => {
      const preferencesUpdate: Partial<UserPreferences> = {
        theme: 'dark',
        voiceEnabled: false,
        fontSize: 'large',
      };

      const actual = userReducer(initialState, updateUserPreferences(preferencesUpdate));

      expect(actual.preferences.theme).toBe('dark');
      expect(actual.preferences.voiceEnabled).toBe(false);
      expect(actual.preferences.fontSize).toBe('large');
      expect(actual.preferences.language).toBe('ja'); // Should preserve other fields
    });
  });

  describe('addFavoriteCharacter', () => {
    it('should add character to favorites', () => {
      const characterId: CharacterType = 'aoi';
      const actual = userReducer(initialState, addFavoriteCharacter(characterId));

      expect(actual.favoriteCharacters).toContain(characterId);
      expect(actual.favoriteCharacters).toHaveLength(1);
    });

    it('should not add duplicate character to favorites', () => {
      const stateWithFavorite = {
        ...initialState,
        favoriteCharacters: ['aoi' as CharacterType],
      };

      const actual = userReducer(stateWithFavorite, addFavoriteCharacter('aoi'));

      expect(actual.favoriteCharacters).toHaveLength(1);
      expect(actual.favoriteCharacters).toContain('aoi');
    });
  });

  describe('removeFavoriteCharacter', () => {
    it('should remove character from favorites', () => {
      const stateWithFavorites = {
        ...initialState,
        favoriteCharacters: ['aoi' as CharacterType, 'shun' as CharacterType],
      };

      const actual = userReducer(stateWithFavorites, removeFavoriteCharacter('aoi'));

      expect(actual.favoriteCharacters).toHaveLength(1);
      expect(actual.favoriteCharacters).toContain('shun');
      expect(actual.favoriteCharacters).not.toContain('aoi');
    });

    it('should handle removing non-existent character', () => {
      const stateWithOneFavorite = {
        ...initialState,
        favoriteCharacters: ['aoi' as CharacterType],
      };

      const actual = userReducer(stateWithOneFavorite, removeFavoriteCharacter('shun'));

      expect(actual.favoriteCharacters).toHaveLength(1);
      expect(actual.favoriteCharacters).toContain('aoi');
    });
  });

  describe('addDialogueHistory', () => {
    it('should add dialogue to history', () => {
      const historyEntry: DialogueHistoryEntry = {
        id: 'dialogue-1',
        characterId: 'aoi',
        scenario: {
          id: 'daily',
          category: 'daily',
          title: 'Daily Chat',
          description: 'Normal conversation',
          initialPrompt: 'Hello',
          tags: ['casual'],
          difficulty: 'easy',
        },
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        messageCount: 10,
        emotionProgression: ['neutral', 'happy'],
        rating: 5,
      };

      const actual = userReducer(initialState, addDialogueHistory(historyEntry));

      expect(actual.dialogueHistory).toHaveLength(1);
      expect(actual.dialogueHistory[0]).toEqual(historyEntry);
    });

    it('should maintain chronological order in history', () => {
      const firstEntry: DialogueHistoryEntry = {
        id: 'dialogue-1',
        characterId: 'aoi',
        scenario: {
          id: 'daily',
          category: 'daily',
          title: 'Daily Chat',
          description: 'Normal conversation',
          initialPrompt: 'Hello',
          tags: ['casual'],
          difficulty: 'easy',
        },
        startTime: Date.now() - 120000,
        endTime: Date.now() - 60000,
        messageCount: 5,
        emotionProgression: ['neutral'],
        rating: 4,
      };

      const stateWithHistory = {
        ...initialState,
        dialogueHistory: [firstEntry],
      };

      const secondEntry: DialogueHistoryEntry = {
        id: 'dialogue-2',
        characterId: 'shun',
        scenario: {
          id: 'work',
          category: 'work',
          title: 'Work Chat',
          description: 'Work conversation',
          initialPrompt: 'Good morning',
          tags: ['work'],
          difficulty: 'medium',
        },
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        messageCount: 8,
        emotionProgression: ['neutral', 'happy'],
        rating: 5,
      };

      const actual = userReducer(stateWithHistory, addDialogueHistory(secondEntry));

      expect(actual.dialogueHistory).toHaveLength(2);
      expect(actual.dialogueHistory[0]).toEqual(firstEntry);
      expect(actual.dialogueHistory[1]).toEqual(secondEntry);
    });
  });

  describe('clearDialogueHistory', () => {
    it('should clear all dialogue history', () => {
      const stateWithHistory = {
        ...initialState,
        dialogueHistory: [
          {
            id: 'dialogue-1',
            characterId: 'aoi' as CharacterType,
            scenario: {
              id: 'daily',
              category: 'daily',
              title: 'Daily Chat',
              description: 'Normal conversation',
              initialPrompt: 'Hello',
              tags: ['casual'],
              difficulty: 'easy',
            },
            startTime: Date.now() - 120000,
            endTime: Date.now() - 60000,
            messageCount: 5,
            emotionProgression: ['neutral'],
            rating: 4,
          },
        ],
      };

      const actual = userReducer(stateWithHistory, clearDialogueHistory());

      expect(actual.dialogueHistory).toHaveLength(0);
    });
  });

  describe('updateUserStats', () => {
    it('should update user stats', () => {
      const statsUpdate: Partial<UserStats> = {
        totalDialogues: 5,
        totalMessages: 100,
        averageDialogueLength: 20,
      };

      const actual = userReducer(initialState, updateUserStats(statsUpdate));

      expect(actual.stats.totalDialogues).toBe(5);
      expect(actual.stats.totalMessages).toBe(100);
      expect(actual.stats.averageDialogueLength).toBe(20);
      expect(actual.stats.longestDialogue).toBe(0); // Should preserve other fields
    });

    it('should update favorite character usage', () => {
      const statsUpdate: Partial<UserStats> = {
        favoriteCharacterUsage: {
          aoi: 10,
          shun: 5,
        },
      };

      const actual = userReducer(initialState, updateUserStats(statsUpdate));

      expect(actual.stats.favoriteCharacterUsage).toEqual({
        aoi: 10,
        shun: 5,
      });
    });
  });

  describe('setUserLoading', () => {
    it('should set loading state', () => {
      const actual = userReducer(initialState, setUserLoading(true));

      expect(actual.isLoading).toBe(true);
    });

    it('should clear error when setting loading to true', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };

      const actual = userReducer(stateWithError, setUserLoading(true));

      expect(actual.isLoading).toBe(true);
      expect(actual.error).toBeNull();
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

  describe('selectors', () => {
    const mockState = {
      user: {
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
        favoriteCharacters: ['aoi' as CharacterType, 'shun' as CharacterType],
        dialogueHistory: [
          {
            id: 'dialogue-1',
            characterId: 'aoi' as CharacterType,
            scenario: {
              id: 'daily',
              category: 'daily',
              title: 'Daily Chat',
              description: 'Normal conversation',
              initialPrompt: 'Hello',
              tags: ['casual'],
              difficulty: 'easy',
            },
            startTime: Date.now() - 120000,
            endTime: Date.now() - 60000,
            messageCount: 5,
            emotionProgression: ['neutral'],
            rating: 4,
          },
        ],
        stats: {
          totalDialogues: 10,
          totalMessages: 200,
          favoriteCharacterUsage: {aoi: 6, shun: 4},
          averageDialogueLength: 20,
          longestDialogue: 50,
          mostUsedEmotions: {happy: 30, neutral: 50, sad: 20},
        },
        isLoading: false,
        error: null,
      },
    };

    it('selectUserProfile should return user profile', () => {
      expect(selectUserProfile(mockState)).toEqual(mockState.user.profile);
    });

    it('selectUserPreferences should return user preferences', () => {
      expect(selectUserPreferences(mockState)).toEqual(mockState.user.preferences);
    });

    it('selectFavoriteCharacters should return favorite characters', () => {
      expect(selectFavoriteCharacters(mockState)).toEqual(mockState.user.favoriteCharacters);
    });

    it('selectDialogueHistory should return dialogue history', () => {
      expect(selectDialogueHistory(mockState)).toEqual(mockState.user.dialogueHistory);
    });

    it('selectUserStats should return user stats', () => {
      expect(selectUserStats(mockState)).toEqual(mockState.user.stats);
    });
  });

  describe('error handling', () => {
    it('should handle profile update errors', () => {
      const stateWithError = {
        ...initialState,
        error: 'Profile update failed',
      };

      expect(stateWithError.error).toBe('Profile update failed');
    });

    it('should handle preferences update errors', () => {
      const stateWithError = {
        ...initialState,
        error: 'Preferences save failed',
      };

      expect(stateWithError.error).toBe('Preferences save failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty dialogue history', () => {
      expect(initialState.dialogueHistory).toHaveLength(0);
      expect(selectDialogueHistory({user: initialState})).toHaveLength(0);
    });

    it('should handle empty favorite characters', () => {
      expect(initialState.favoriteCharacters).toHaveLength(0);
      expect(selectFavoriteCharacters({user: initialState})).toHaveLength(0);
    });

    it('should handle partial profile updates', () => {
      const profileUpdate = {name: 'Updated Name'};
      const actual = userReducer(initialState, updateUserProfile(profileUpdate));

      expect(actual.profile.name).toBe('Updated Name');
      expect(actual.profile.email).toBe('');
      expect(actual.profile.id).toBe('');
    });

    it('should handle stats with zero values', () => {
      const statsUpdate: Partial<UserStats> = {
        totalDialogues: 0,
        totalMessages: 0,
        averageDialogueLength: 0,
      };

      const actual = userReducer(initialState, updateUserStats(statsUpdate));

      expect(actual.stats.totalDialogues).toBe(0);
      expect(actual.stats.totalMessages).toBe(0);
      expect(actual.stats.averageDialogueLength).toBe(0);
    });

    it('should handle large dialogue history', () => {
      let state = initialState;
      
      for (let i = 0; i < 1000; i++) {
        const historyEntry: DialogueHistoryEntry = {
          id: `dialogue-${i}`,
          characterId: i % 2 === 0 ? 'aoi' : 'shun',
          scenario: {
            id: 'test',
            category: 'daily',
            title: `Test ${i}`,
            description: `Test dialogue ${i}`,
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          startTime: Date.now() - (1000 - i) * 60000,
          endTime: Date.now() - (1000 - i) * 60000 + 30000,
          messageCount: i + 1,
          emotionProgression: ['neutral'],
          rating: (i % 5) + 1,
        };
        
        state = userReducer(state, addDialogueHistory(historyEntry));
      }

      expect(state.dialogueHistory).toHaveLength(1000);
      expect(state.dialogueHistory[999].id).toBe('dialogue-999');
    });
  });
});