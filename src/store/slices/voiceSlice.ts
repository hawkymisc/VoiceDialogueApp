import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';
import type {RootState} from '../store';
import {EmotionState} from '../../types/Dialogue';
import {CharacterType} from '../../types/Character';
import {ttsService, TTSRequest} from '../../services/ttsService';
import {audioPlayerService, AudioTrack} from '../../services/audioPlayerService';

export interface VoiceState {
  isGenerating: boolean;
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  voiceSettings: {
    [key in CharacterType]: {
      volume: number;
      speed: number;
      pitch: number;
    };
  };
  autoPlay: boolean;
  error: string | null;
}

// Async thunk for generating speech
export const generateSpeech = createAsyncThunk(
  'voice/generateSpeech',
  async (params: {
    text: string;
    characterId: CharacterType;
    emotion: EmotionState;
    messageId: string;
  }) => {
    const request: TTSRequest = {
      text: params.text,
      characterId: params.characterId,
      emotion: params.emotion,
    };

    const response = await ttsService.synthesizeSpeech(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate speech');
    }

    const audioTrack: AudioTrack = {
      id: `voice_${params.messageId}`,
      audioUrl: response.audioUrl,
      audioData: response.audioData,
      text: params.text,
      characterId: params.characterId,
      emotion: params.emotion,
      duration: response.duration,
    };

    return audioTrack;
  }
);

// Async thunk for playing audio
export const playAudio = createAsyncThunk(
  'voice/playAudio',
  async (track: AudioTrack) => {
    await audioPlayerService.playAudio(track);
    return track;
  }
);

const initialState: VoiceState = {
  isGenerating: false,
  isPlaying: false,
  currentTrack: null,
  voiceSettings: {
    aoi: {
      volume: 80,
      speed: 1.0,
      pitch: 5,
    },
    shun: {
      volume: 85,
      speed: 0.95,
      pitch: -3,
    },
  },
  autoPlay: true,
  error: null,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setVoiceSettings: (state, action: PayloadAction<{
      characterId: CharacterType;
      settings: Partial<VoiceState['voiceSettings'][CharacterType]>;
    }>) => {
      const {characterId, settings} = action.payload;
      state.voiceSettings[characterId] = {
        ...state.voiceSettings[characterId],
        ...settings,
      };
    },

    setAutoPlay: (state, action: PayloadAction<boolean>) => {
      state.autoPlay = action.payload;
    },

    setCurrentTrack: (state, action: PayloadAction<AudioTrack | null>) => {
      state.currentTrack = action.payload;
    },

    setPlaybackState: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },

    clearVoiceError: (state) => {
      state.error = null;
    },

    stopAllAudio: (state) => {
      state.isPlaying = false;
      state.currentTrack = null;
      // Stop audio service
      audioPlayerService.stopAudio();
    },

    pauseAudio: (state) => {
      state.isPlaying = false;
      audioPlayerService.pauseAudio();
    },

    resumeAudio: (state) => {
      state.isPlaying = true;
      audioPlayerService.resumeAudio();
    },

    setVolume: (state, action: PayloadAction<{
      characterId: CharacterType;
      volume: number;
    }>) => {
      const {characterId, volume} = action.payload;
      state.voiceSettings[characterId].volume = volume;
      // Update audio player volume
      audioPlayerService.setVolume(volume / 100);
    },

    setSpeed: (state, action: PayloadAction<{
      characterId: CharacterType;
      speed: number;
    }>) => {
      const {characterId, speed} = action.payload;
      state.voiceSettings[characterId].speed = speed;
      // Update audio player speed
      audioPlayerService.setSpeed(speed);
    },

    setPitch: (state, action: PayloadAction<{
      characterId: CharacterType;
      pitch: number;
    }>) => {
      const {characterId, pitch} = action.payload;
      state.voiceSettings[characterId].pitch = pitch;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateSpeech.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateSpeech.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.currentTrack = action.payload;
        
        // Auto-play if enabled
        if (state.autoPlay) {
          audioPlayerService.playAudio(action.payload);
          state.isPlaying = true;
        }
      })
      .addCase(generateSpeech.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.error.message || 'Failed to generate speech';
      })
      .addCase(playAudio.pending, (state) => {
        state.error = null;
      })
      .addCase(playAudio.fulfilled, (state, action) => {
        state.isPlaying = true;
        state.currentTrack = action.payload;
      })
      .addCase(playAudio.rejected, (state, action) => {
        state.isPlaying = false;
        state.error = action.error.message || 'Failed to play audio';
      });
  },
});

export const {
  setVoiceSettings,
  setAutoPlay,
  setCurrentTrack,
  setPlaybackState,
  clearVoiceError,
  stopAllAudio,
  pauseAudio,
  resumeAudio,
  setVolume,
  setSpeed,
  setPitch,
} = voiceSlice.actions;

// Selectors
export const selectVoiceState = (state: RootState) => state.voice;
export const selectIsGenerating = (state: RootState) => state.voice.isGenerating;
export const selectIsPlaying = (state: RootState) => state.voice.isPlaying;
export const selectCurrentTrack = (state: RootState) => state.voice.currentTrack;
export const selectVoiceSettings = (state: RootState) => state.voice.voiceSettings;
export const selectAutoPlay = (state: RootState) => state.voice.autoPlay;
export const selectVoiceError = (state: RootState) => state.voice.error;

export default voiceSlice.reducer;