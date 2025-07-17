import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {UserState, UserProfile, UserPreferences} from '../../types/User';

// Initial state
const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  favoriteConversations: [],
  unlockedContent: [],
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, {rejectWithValue}) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data: UserProfile = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (
    {userId, updates}: {userId: string; updates: Partial<UserProfile>},
    {rejectWithValue},
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }
      const data: UserProfile = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (
    {
      userId,
      preferences,
    }: {userId: string; preferences: Partial<UserPreferences>},
    {rejectWithValue},
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }
      const data: UserPreferences = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, {rejectWithValue}) => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

// User slice
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    updatePreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences>>,
    ) => {
      if (state.profile) {
        state.profile.preferences = {
          ...state.profile.preferences,
          ...action.payload,
        };
      }
    },
    addFavoriteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      if (!state.favoriteConversations.includes(conversationId)) {
        state.favoriteConversations.push(conversationId);
      }
    },
    removeFavoriteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.favoriteConversations = state.favoriteConversations.filter(
        id => id !== conversationId,
      );
    },
    unlockContent: (state, action: PayloadAction<string>) => {
      const contentId = action.payload;
      if (!state.unlockedContent.includes(contentId)) {
        state.unlockedContent.push(contentId);
      }
    },
    updateStatistics: (
      state,
      action: PayloadAction<Partial<UserProfile['statistics']>>,
    ) => {
      if (state.profile) {
        state.profile.statistics = {
          ...state.profile.statistics,
          ...action.payload,
        };
      }
    },
    incrementConversationCount: state => {
      if (state.profile) {
        state.profile.statistics.totalConversations += 1;
      }
    },
    updateLastActiveDate: state => {
      if (state.profile) {
        state.profile.statistics.lastActiveDate = new Date();
        state.profile.lastLoginAt = new Date();
      }
    },
    clearUserError: state => {
      state.error = null;
    },
    resetUserState: state => {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Update user profile
      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update user preferences
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.preferences = action.payload;
        }
      })
      // Login user
      .addCase(loginUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.user;
        state.isAuthenticated = true;
        // Store token in AsyncStorage for React Native
        // Note: In a real app, you would use @react-native-async-storage/async-storage
        // For now, we'll just store it in memory or skip this step
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout user
      .addCase(logoutUser.fulfilled, state => {
        state.profile = null;
        state.isAuthenticated = false;
        state.favoriteConversations = [];
        state.unlockedContent = [];
        // Remove token from AsyncStorage for React Native
        // Note: In a real app, you would use @react-native-async-storage/async-storage
        // For now, we'll just clear it from memory or skip this step
      });
  },
});

export const {
  setAuthenticated,
  updatePreferences,
  addFavoriteConversation,
  removeFavoriteConversation,
  unlockContent,
  updateStatistics,
  incrementConversationCount,
  updateLastActiveDate,
  clearUserError,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;
