import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';
import type {RootState} from '../store';
import {
  Live2DState,
  Live2DModel,
  Live2DModelConfig,
  Live2DExpression,
  Live2DMotion,
  Live2DParameter,
  Live2DRenderConfig,
  Live2DEvent,
} from '../../types/Live2D';
import {EmotionState} from '../../types/Dialogue';
import {CharacterType} from '../../types/Character';
import {live2dService} from '../../services/live2dService';

// Async thunk for initializing Live2D
export const initializeLive2D = createAsyncThunk(
  'live2d/initialize',
  async () => {
    await live2dService.initialize();
    return true;
  }
);

// Async thunk for loading a model
export const loadModel = createAsyncThunk(
  'live2d/loadModel',
  async (params: {characterId: CharacterType}) => {
    const config = live2dService.getCharacterModel(params.characterId);
    const model = await live2dService.loadModel(config);
    return {model, characterId: params.characterId};
  }
);

// Async thunk for setting expression
export const setExpression = createAsyncThunk(
  'live2d/setExpression',
  async (params: {emotion: EmotionState; intensity?: number}) => {
    const expression = live2dService.getExpressionForEmotion(params.emotion);
    if (params.intensity !== undefined) {
      expression.intensity = params.intensity;
    }
    await live2dService.setExpression(expression);
    return expression;
  }
);

// Async thunk for playing motion
export const playMotion = createAsyncThunk(
  'live2d/playMotion',
  async (params: {group: string; motionId?: string}) => {
    let motion: Live2DMotion | null;
    
    if (params.motionId) {
      const motions = live2dService.getMotionsForGroup(params.group);
      motion = motions.find(m => m.id === params.motionId) || null;
    } else {
      motion = live2dService.getRandomMotion(params.group);
    }
    
    if (!motion) {
      throw new Error(`No motion found for group: ${params.group}`);
    }
    
    await live2dService.playMotion(motion);
    return motion;
  }
);

// Async thunk for starting lip sync
export const startLipSync = createAsyncThunk(
  'live2d/startLipSync',
  async (params: {audioData: ArrayBuffer; sensitivity?: number}) => {
    live2dService.startLipSync(params.audioData, params.sensitivity);
    return {audioData: params.audioData, sensitivity: params.sensitivity || 1.0};
  }
);

const initialState: Live2DState = {
  currentModel: null,
  availableModels: [],
  currentExpression: null,
  currentMotion: null,
  isPlaying: false,
  isLoading: false,
  renderConfig: {
    viewport: {
      x: 0,
      y: 0,
      width: 400,
      height: 600,
      scale: 1.0,
    },
    backgroundColor: 'transparent',
    antialias: true,
    fps: 60,
    quality: 'high',
  },
  parameters: [],
  error: null,
};

const live2dSlice = createSlice({
  name: 'live2d',
  initialState,
  reducers: {
    setCurrentModel: (state, action: PayloadAction<Live2DModel | null>) => {
      state.currentModel = action.payload;
    },

    setCurrentExpression: (state, action: PayloadAction<Live2DExpression | null>) => {
      state.currentExpression = action.payload;
    },

    setCurrentMotion: (state, action: PayloadAction<Live2DMotion | null>) => {
      state.currentMotion = action.payload;
    },

    setPlayingState: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },

    setParameter: (state, action: PayloadAction<{id: string; value: number}>) => {
      const {id, value} = action.payload;
      const parameter = state.parameters.find(p => p.id === id);
      if (parameter) {
        parameter.value = value;
      }
      // Also update the Live2D service
      live2dService.setParameter(id, value);
    },

    addParameter: (state, action: PayloadAction<Live2DParameter>) => {
      const existingIndex = state.parameters.findIndex(p => p.id === action.payload.id);
      if (existingIndex !== -1) {
        state.parameters[existingIndex] = action.payload;
      } else {
        state.parameters.push(action.payload);
      }
    },

    updateRenderConfig: (state, action: PayloadAction<Partial<Live2DRenderConfig>>) => {
      state.renderConfig = {...state.renderConfig, ...action.payload};
    },

    updateViewport: (state, action: PayloadAction<Partial<Live2DState['renderConfig']['viewport']>>) => {
      state.renderConfig.viewport = {
        ...state.renderConfig.viewport,
        ...action.payload,
      };
    },

    clearLive2DError: (state) => {
      state.error = null;
    },

    resetLive2DState: (state) => {
      state.currentModel = null;
      state.currentExpression = null;
      state.currentMotion = null;
      state.isPlaying = false;
      state.isLoading = false;
      state.parameters = [];
      state.error = null;
    },

    handleLive2DEvent: (state, action: PayloadAction<Live2DEvent>) => {
      const event = action.payload;
      
      switch (event.type) {
        case 'modelLoaded':
          if (event.data?.model) {
            state.currentModel = event.data.model;
          }
          break;
        case 'expressionChanged':
          if (event.data?.expression) {
            state.currentExpression = event.data.expression;
          }
          break;
        case 'motionStarted':
          if (event.data?.motion) {
            state.currentMotion = event.data.motion;
            state.isPlaying = true;
          }
          break;
        case 'motionEnded':
          if (event.data?.motion && state.currentMotion?.id === event.data.motion.id) {
            state.currentMotion = null;
            state.isPlaying = false;
          }
          break;
        case 'parameterChanged':
          if (event.data?.parameterId && event.data?.value !== undefined) {
            const parameter = state.parameters.find(p => p.id === event.data.parameterId);
            if (parameter) {
              parameter.value = event.data.value;
            }
          }
          break;
        case 'error':
          state.error = event.data?.error || 'Unknown Live2D error';
          break;
        default:
          break;
      }
    },

    // Auto animation controls
    setAutoBlinking: (state, action: PayloadAction<boolean>) => {
      live2dService.setAutoBlinking(action.payload);
    },

    setAutoBreathing: (state, action: PayloadAction<boolean>) => {
      live2dService.setAutoBreathing(action.payload);
    },

    setEyeTrackingTarget: (state, action: PayloadAction<{x: number; y: number}>) => {
      const {x, y} = action.payload;
      live2dService.setEyeTrackingTarget(x, y);
    },

    stopLipSync: (state) => {
      live2dService.stopLipSync();
    },

    // Dispose Live2D resources
    disposeLive2D: (state) => {
      live2dService.dispose();
      state.currentModel = null;
      state.currentExpression = null;
      state.currentMotion = null;
      state.isPlaying = false;
      state.isLoading = false;
      state.parameters = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeLive2D.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeLive2D.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(initializeLive2D.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to initialize Live2D';
      })
      .addCase(loadModel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadModel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentModel = action.payload.model;
        
        // Add model to available models if not already present
        const existingIndex = state.availableModels.findIndex(m => m.id === action.payload.model.id);
        if (existingIndex === -1) {
          state.availableModels.push(action.payload.model);
        }
      })
      .addCase(loadModel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load model';
      })
      .addCase(setExpression.pending, (state) => {
        state.error = null;
      })
      .addCase(setExpression.fulfilled, (state, action) => {
        state.currentExpression = action.payload;
      })
      .addCase(setExpression.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to set expression';
      })
      .addCase(playMotion.pending, (state) => {
        state.error = null;
      })
      .addCase(playMotion.fulfilled, (state, action) => {
        state.currentMotion = action.payload;
        state.isPlaying = true;
      })
      .addCase(playMotion.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to play motion';
      })
      .addCase(startLipSync.pending, (state) => {
        state.error = null;
      })
      .addCase(startLipSync.fulfilled, (state) => {
        // Lip sync started successfully
      })
      .addCase(startLipSync.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to start lip sync';
      });
  },
});

export const {
  setCurrentModel,
  setCurrentExpression,
  setCurrentMotion,
  setPlayingState,
  setParameter,
  addParameter,
  updateRenderConfig,
  updateViewport,
  clearLive2DError,
  resetLive2DState,
  handleLive2DEvent,
  setAutoBlinking,
  setAutoBreathing,
  setEyeTrackingTarget,
  stopLipSync,
  disposeLive2D,
} = live2dSlice.actions;

// Selectors
export const selectLive2DState = (state: RootState) => state.live2d;
export const selectCurrentModel = (state: RootState) => state.live2d.currentModel;
export const selectCurrentExpression = (state: RootState) => state.live2d.currentExpression;
export const selectCurrentMotion = (state: RootState) => state.live2d.currentMotion;
export const selectIsPlaying = (state: RootState) => state.live2d.isPlaying;
export const selectIsLoading = (state: RootState) => state.live2d.isLoading;
export const selectRenderConfig = (state: RootState) => state.live2d.renderConfig;
export const selectParameters = (state: RootState) => state.live2d.parameters;
export const selectLive2DError = (state: RootState) => state.live2d.error;

export default live2dSlice.reducer;