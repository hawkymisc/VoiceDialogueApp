import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  AudioState,
  VoiceSynthesisRequest,
  VoiceSynthesisResponse,
  AudioPlayerState,
} from '../../types/Audio';

// Initial state
const initialState: AudioState = {
  player: {
    isPlaying: false,
    currentAudioUrl: null,
    volume: 80,
    speed: 1.0,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
  },
  cache: {},
  ttsConfig: {
    provider: 'azure',
    defaultSettings: {
      rate: 'medium',
      pitch: 'medium',
      volume: 'medium',
    },
  },
  isInitialized: false,
  supportedFormats: ['mp3', 'wav', 'aac'],
};

// Async thunks
export const synthesizeVoice = createAsyncThunk(
  'audio/synthesizeVoice',
  async (request: VoiceSynthesisRequest, {rejectWithValue}) => {
    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to synthesize voice');
      }
      const data: VoiceSynthesisResponse = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const initializeAudio = createAsyncThunk(
  'audio/initialize',
  async (_, {rejectWithValue}) => {
    try {
      // Initialize audio system
      // This would include checking permissions, setting up audio session, etc.
      const supportedFormats = ['mp3', 'wav', 'aac']; // Detect supported formats
      return {supportedFormats};
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

// Audio slice
export const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    // Player controls
    playAudio: (state, action: PayloadAction<string>) => {
      state.player.currentAudioUrl = action.payload;
      state.player.isPlaying = true;
      state.player.error = null;
    },
    pauseAudio: state => {
      state.player.isPlaying = false;
    },
    stopAudio: state => {
      state.player.isPlaying = false;
      state.player.currentTime = 0;
      state.player.currentAudioUrl = null;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.player.volume = Math.max(0, Math.min(100, action.payload));
    },
    setSpeed: (state, action: PayloadAction<number>) => {
      state.player.speed = Math.max(0.5, Math.min(2.0, action.payload));
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.player.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.player.duration = action.payload;
    },
    setPlayerLoading: (state, action: PayloadAction<boolean>) => {
      state.player.isLoading = action.payload;
    },
    setPlayerError: (state, action: PayloadAction<string | null>) => {
      state.player.error = action.payload;
    },

    // Cache management
    addToCache: (
      state,
      action: PayloadAction<{
        key: string;
        audioUrl: string;
        expiresAt: Date;
        size: number;
      }>,
    ) => {
      const {key, audioUrl, expiresAt, size} = action.payload;
      state.cache[key] = {audioUrl, expiresAt, size};
    },
    removeFromCache: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.cache[key];
    },
    clearCache: state => {
      state.cache = {};
    },
    cleanExpiredCache: state => {
      const now = new Date();
      Object.keys(state.cache).forEach(key => {
        if (new Date(state.cache[key].expiresAt) < now) {
          delete state.cache[key];
        }
      });
    },

    // TTS configuration
    updateTTSConfig: (
      state,
      action: PayloadAction<Partial<AudioState['ttsConfig']>>,
    ) => {
      state.ttsConfig = {
        ...state.ttsConfig,
        ...action.payload,
      };
    },

    // System
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setSupportedFormats: (state, action: PayloadAction<string[]>) => {
      state.supportedFormats = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Synthesize voice
      .addCase(synthesizeVoice.pending, state => {
        state.player.isLoading = true;
        state.player.error = null;
      })
      .addCase(synthesizeVoice.fulfilled, (state, action) => {
        state.player.isLoading = false;
        const {audioUrl, duration, metadata} = action.payload;

        // Add to cache
        const cacheKey = `${metadata.characterId}_${
          metadata.emotion
        }_${Date.now()}`;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

        state.cache[cacheKey] = {
          audioUrl,
          expiresAt,
          size: 0, // Size would be calculated from actual audio data
        };

        // Set as current audio if no audio is currently playing
        if (!state.player.currentAudioUrl) {
          state.player.currentAudioUrl = audioUrl;
          state.player.duration = duration;
        }
      })
      .addCase(synthesizeVoice.rejected, (state, action) => {
        state.player.isLoading = false;
        state.player.error = action.payload as string;
      })

      // Initialize audio
      .addCase(initializeAudio.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.supportedFormats = action.payload.supportedFormats;
      })
      .addCase(initializeAudio.rejected, (state, action) => {
        state.isInitialized = false;
        state.player.error = action.payload as string;
      });
  },
});

export const {
  playAudio,
  pauseAudio,
  stopAudio,
  setVolume,
  setSpeed,
  setCurrentTime,
  setDuration,
  setPlayerLoading,
  setPlayerError,
  addToCache,
  removeFromCache,
  clearCache,
  cleanExpiredCache,
  updateTTSConfig,
  setInitialized,
  setSupportedFormats,
} = audioSlice.actions;

export default audioSlice.reducer;
