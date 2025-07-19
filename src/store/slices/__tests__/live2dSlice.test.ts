import {configureStore} from '@reduxjs/toolkit';
import live2dSlice, {
  initializeLive2D,
  loadModel,
  setExpression,
  playMotion,
  startLipSync,
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
} from '../live2dSlice';
import {live2dService} from '../../../services/live2dService';
import {Live2DEvent} from '../../../types/Live2D';

// Mock the Live2D service
jest.mock('../../../services/live2dService');

const mockLive2DService = live2dService as jest.Mocked<typeof live2dService>;

describe('live2dSlice', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    store = configureStore({
      reducer: {
        live2d: live2dSlice,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['live2d/startLipSync/fulfilled'],
          },
        }),
    });

    // Mock service methods
    mockLive2DService.initialize.mockResolvedValue(undefined);
    mockLive2DService.getCharacterModel.mockReturnValue({
      modelPath: '/assets/live2d/aoi/aoi.model3.json',
      texturePath: '/assets/live2d/aoi/textures/',
    });
    mockLive2DService.loadModel.mockResolvedValue({
      id: 'test-model',
      name: 'Test Model',
      config: {
        modelPath: '/assets/live2d/aoi/aoi.model3.json',
        texturePath: '/assets/live2d/aoi/textures/',
      },
      isLoaded: true,
    });
    mockLive2DService.getExpressionForEmotion.mockReturnValue({
      id: 'exp_happy',
      name: 'Happy',
      file: 'happy.exp3.json',
      emotion: 'happy',
      intensity: 0.8,
    });
    mockLive2DService.getRandomMotion.mockReturnValue({
      id: 'idle_01',
      name: 'Idle 1',
      file: 'idle_01.motion3.json',
      group: 'idle',
      priority: 1,
      loop: true,
      duration: 5000,
      fadeIn: 500,
      fadeOut: 500,
    });
    mockLive2DService.setExpression.mockResolvedValue(undefined);
    mockLive2DService.playMotion.mockResolvedValue(undefined);
    mockLive2DService.startLipSync.mockImplementation(() => {});
    mockLive2DService.stopLipSync.mockImplementation(() => {});
    mockLive2DService.setParameter.mockImplementation(() => {});
    mockLive2DService.setAutoBlinking.mockImplementation(() => {});
    mockLive2DService.setAutoBreathing.mockImplementation(() => {});
    mockLive2DService.setEyeTrackingTarget.mockImplementation(() => {});
    mockLive2DService.dispose.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().live2d;
      
      expect(state.currentModel).toBeNull();
      expect(state.availableModels).toEqual([]);
      expect(state.currentExpression).toBeNull();
      expect(state.currentMotion).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.parameters).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.renderConfig).toBeDefined();
      expect(state.renderConfig.viewport).toBeDefined();
      expect(state.renderConfig.quality).toBe('high');
    });

    it('should have correct render config defaults', () => {
      const state = store.getState().live2d;
      
      expect(state.renderConfig.viewport.x).toBe(0);
      expect(state.renderConfig.viewport.y).toBe(0);
      expect(state.renderConfig.viewport.width).toBe(400);
      expect(state.renderConfig.viewport.height).toBe(600);
      expect(state.renderConfig.viewport.scale).toBe(1.0);
      expect(state.renderConfig.backgroundColor).toBe('transparent');
      expect(state.renderConfig.antialias).toBe(true);
      expect(state.renderConfig.fps).toBe(60);
    });
  });

  describe('Synchronous Actions', () => {
    it('should set current model', () => {
      const model = {
        id: 'test-model',
        name: 'Test Model',
        config: {modelPath: '/test/path'},
        isLoaded: true,
      };

      store.dispatch(setCurrentModel(model));

      const state = store.getState().live2d;
      expect(state.currentModel).toEqual(model);
    });

    it('should set current expression', () => {
      const expression = {
        id: 'exp_happy',
        name: 'Happy',
        file: 'happy.exp3.json',
        emotion: 'happy' as const,
        intensity: 0.8,
      };

      store.dispatch(setCurrentExpression(expression));

      const state = store.getState().live2d;
      expect(state.currentExpression).toEqual(expression);
    });

    it('should set current motion', () => {
      const motion = {
        id: 'idle_01',
        name: 'Idle 1',
        file: 'idle_01.motion3.json',
        group: 'idle',
        priority: 1,
        loop: true,
        duration: 5000,
        fadeIn: 500,
        fadeOut: 500,
      };

      store.dispatch(setCurrentMotion(motion));

      const state = store.getState().live2d;
      expect(state.currentMotion).toEqual(motion);
    });

    it('should set playing state', () => {
      store.dispatch(setPlayingState(true));

      const state = store.getState().live2d;
      expect(state.isPlaying).toBe(true);

      store.dispatch(setPlayingState(false));

      const newState = store.getState().live2d;
      expect(newState.isPlaying).toBe(false);
    });

    it('should set parameter', () => {
      const parameter = {
        id: 'ParamAngleX',
        name: 'Angle X',
        value: 15,
        min: -30,
        max: 30,
        default: 0,
      };

      store.dispatch(addParameter(parameter));
      store.dispatch(setParameter({id: 'ParamAngleX', value: 20}));

      const state = store.getState().live2d;
      const updatedParam = state.parameters.find(p => p.id === 'ParamAngleX');
      expect(updatedParam?.value).toBe(20);
      expect(mockLive2DService.setParameter).toHaveBeenCalledWith('ParamAngleX', 20);
    });

    it('should add parameter', () => {
      const parameter = {
        id: 'ParamAngleX',
        name: 'Angle X',
        value: 15,
        min: -30,
        max: 30,
        default: 0,
      };

      store.dispatch(addParameter(parameter));

      const state = store.getState().live2d;
      expect(state.parameters).toHaveLength(1);
      expect(state.parameters[0]).toEqual(parameter);
    });

    it('should update existing parameter', () => {
      const parameter1 = {
        id: 'ParamAngleX',
        name: 'Angle X',
        value: 15,
        min: -30,
        max: 30,
        default: 0,
      };

      const parameter2 = {
        id: 'ParamAngleX',
        name: 'Angle X Updated',
        value: 25,
        min: -30,
        max: 30,
        default: 0,
      };

      store.dispatch(addParameter(parameter1));
      store.dispatch(addParameter(parameter2));

      const state = store.getState().live2d;
      expect(state.parameters).toHaveLength(1);
      expect(state.parameters[0]).toEqual(parameter2);
    });

    it('should update render config', () => {
      store.dispatch(updateRenderConfig({
        quality: 'medium',
        fps: 30,
      }));

      const state = store.getState().live2d;
      expect(state.renderConfig.quality).toBe('medium');
      expect(state.renderConfig.fps).toBe(30);
      expect(state.renderConfig.antialias).toBe(true); // Should preserve existing values
    });

    it('should update viewport', () => {
      store.dispatch(updateViewport({
        x: 100,
        y: 200,
        scale: 1.5,
      }));

      const state = store.getState().live2d;
      expect(state.renderConfig.viewport.x).toBe(100);
      expect(state.renderConfig.viewport.y).toBe(200);
      expect(state.renderConfig.viewport.scale).toBe(1.5);
      expect(state.renderConfig.viewport.width).toBe(400); // Should preserve existing values
    });

    it('should clear error', async () => {
      // Set error first by dispatching a failed action  
      const action = initializeLive2D();
      mockLive2DService.initialize.mockRejectedValue(new Error('Test error'));
      
      await store.dispatch(action);

      let state = store.getState().live2d;
      expect(state.error).toBe('Test error');

      store.dispatch(clearLive2DError());

      state = store.getState().live2d;
      expect(state.error).toBeNull();
    });

    it('should reset state', () => {
      // Set some state first
      store.dispatch(setCurrentModel({
        id: 'test',
        name: 'Test',
        config: {modelPath: '/test'},
        isLoaded: true,
      }));
      store.dispatch(setPlayingState(true));

      store.dispatch(resetLive2DState());

      const state = store.getState().live2d;
      expect(state.currentModel).toBeNull();
      expect(state.currentExpression).toBeNull();
      expect(state.currentMotion).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.parameters).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should handle Live2D events', () => {
      const event: Live2DEvent = {
        type: 'modelLoaded',
        data: {
          model: {
            id: 'test-model',
            name: 'Test Model',
            config: {modelPath: '/test/path'},
            isLoaded: true,
          },
        },
        timestamp: Date.now(),
      };

      store.dispatch(handleLive2DEvent(event));

      const state = store.getState().live2d;
      expect(state.currentModel).toEqual(event.data.model);
    });

    it('should handle all event types', () => {
      const events: Live2DEvent[] = [
        {
          type: 'modelLoaded',
          data: {model: {id: 'test', name: 'Test', config: {}, isLoaded: true}},
          timestamp: Date.now(),
        },
        {
          type: 'expressionChanged',
          data: {
            expression: {
              id: 'exp_happy',
              name: 'Happy',
              file: 'happy.exp3.json',
              emotion: 'happy',
              intensity: 0.8,
            },
          },
          timestamp: Date.now(),
        },
        {
          type: 'motionStarted',
          data: {
            motion: {
              id: 'idle_01',
              name: 'Idle 1',
              file: 'idle_01.motion3.json',
              group: 'idle',
              priority: 1,
              loop: true,
              duration: 5000,
              fadeIn: 500,
              fadeOut: 500,
            },
          },
          timestamp: Date.now(),
        },
        {
          type: 'motionEnded',
          data: {
            motion: {
              id: 'idle_01',
              name: 'Idle 1',
              file: 'idle_01.motion3.json',
              group: 'idle',
              priority: 1,
              loop: true,
              duration: 5000,
              fadeIn: 500,
              fadeOut: 500,
            },
          },
          timestamp: Date.now(),
        },
        {
          type: 'parameterChanged',
          data: {parameterId: 'ParamAngleX', value: 15},
          timestamp: Date.now(),
        },
        {
          type: 'error',
          data: {error: 'Test error'},
          timestamp: Date.now(),
        },
      ];

      // Add a parameter first for the parameter change event
      store.dispatch(addParameter({
        id: 'ParamAngleX',
        name: 'Angle X',
        value: 0,
        min: -30,
        max: 30,
        default: 0,
      }));

      // Set current motion for motion end event
      store.dispatch(setCurrentMotion({
        id: 'idle_01',
        name: 'Idle 1',
        file: 'idle_01.motion3.json',
        group: 'idle',
        priority: 1,
        loop: true,
        duration: 5000,
        fadeIn: 500,
        fadeOut: 500,
      }));

      events.forEach(event => {
        store.dispatch(handleLive2DEvent(event));
      });

      const state = store.getState().live2d;
      expect(state.currentModel).toBeDefined();
      expect(state.currentExpression).toBeDefined();
      expect(state.currentMotion).toBeNull(); // Should be null after motion ended
      expect(state.isPlaying).toBe(false);
      expect(state.parameters[0].value).toBe(15);
      expect(state.error).toBe('Test error');
    });

    it('should call service methods for auto animations', () => {
      store.dispatch(setAutoBlinking(true));
      store.dispatch(setAutoBreathing(false));
      store.dispatch(setEyeTrackingTarget({x: 0.5, y: -0.3}));
      store.dispatch(stopLipSync());

      expect(mockLive2DService.setAutoBlinking).toHaveBeenCalledWith(true);
      expect(mockLive2DService.setAutoBreathing).toHaveBeenCalledWith(false);
      expect(mockLive2DService.setEyeTrackingTarget).toHaveBeenCalledWith(0.5, -0.3);
      expect(mockLive2DService.stopLipSync).toHaveBeenCalled();
    });

    it('should dispose Live2D service', () => {
      // Set some state first
      store.dispatch(setCurrentModel({
        id: 'test',
        name: 'Test',
        config: {modelPath: '/test'},
        isLoaded: true,
      }));

      store.dispatch(disposeLive2D());

      expect(mockLive2DService.dispose).toHaveBeenCalled();
      
      const state = store.getState().live2d;
      expect(state.currentModel).toBeNull();
      expect(state.currentExpression).toBeNull();
      expect(state.currentMotion).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.parameters).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Async Actions', () => {
    it('should handle initialization', async () => {
      const action = await store.dispatch(initializeLive2D());

      expect(initializeLive2D.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.initialize).toHaveBeenCalled();

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle initialization errors', async () => {
      mockLive2DService.initialize.mockRejectedValue(new Error('Init failed'));

      const action = await store.dispatch(initializeLive2D());

      expect(initializeLive2D.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Init failed');
    });

    it('should handle model loading', async () => {
      const action = await store.dispatch(loadModel({characterId: 'aoi'}));

      expect(loadModel.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.getCharacterModel).toHaveBeenCalledWith('aoi');
      expect(mockLive2DService.loadModel).toHaveBeenCalled();

      const state = store.getState().live2d;
      expect(state.currentModel).toBeDefined();
      expect(state.currentModel?.isLoaded).toBe(true);
      expect(state.availableModels).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });

    it('should handle model loading errors', async () => {
      mockLive2DService.loadModel.mockRejectedValue(new Error('Load failed'));

      const action = await store.dispatch(loadModel({characterId: 'aoi'}));

      expect(loadModel.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Load failed');
    });

    it('should handle expression setting', async () => {
      const action = await store.dispatch(setExpression({emotion: 'happy'}));

      expect(setExpression.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.getExpressionForEmotion).toHaveBeenCalledWith('happy');
      expect(mockLive2DService.setExpression).toHaveBeenCalled();

      const state = store.getState().live2d;
      expect(state.currentExpression).toBeDefined();
      expect(state.currentExpression?.emotion).toBe('happy');
    });

    it('should handle expression setting with intensity', async () => {
      const action = await store.dispatch(setExpression({emotion: 'happy', intensity: 0.9}));

      expect(setExpression.fulfilled.match(action)).toBe(true);
      
      const expression = mockLive2DService.setExpression.mock.calls[0][0];
      expect(expression.intensity).toBe(0.9);
    });

    it('should handle expression setting errors', async () => {
      mockLive2DService.setExpression.mockRejectedValue(new Error('Expression failed'));

      const action = await store.dispatch(setExpression({emotion: 'happy'}));

      expect(setExpression.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.error).toBe('Expression failed');
    });

    it('should handle motion playing', async () => {
      const action = await store.dispatch(playMotion({group: 'idle'}));

      expect(playMotion.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.getRandomMotion).toHaveBeenCalledWith('idle');
      expect(mockLive2DService.playMotion).toHaveBeenCalled();

      const state = store.getState().live2d;
      expect(state.currentMotion).toBeDefined();
      expect(state.currentMotion?.group).toBe('idle');
      expect(state.isPlaying).toBe(true);
    });

    it('should handle specific motion playing', async () => {
      mockLive2DService.getMotionsForGroup.mockReturnValue([
        {
          id: 'idle_01',
          name: 'Idle 1',
          file: 'idle_01.motion3.json',
          group: 'idle',
          priority: 1,
          loop: true,
          duration: 5000,
          fadeIn: 500,
          fadeOut: 500,
        },
      ]);

      const action = await store.dispatch(playMotion({group: 'idle', motionId: 'idle_01'}));

      expect(playMotion.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.getMotionsForGroup).toHaveBeenCalledWith('idle');
    });

    it('should handle motion not found', async () => {
      mockLive2DService.getRandomMotion.mockReturnValue(null);

      const action = await store.dispatch(playMotion({group: 'nonexistent'}));

      expect(playMotion.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.error).toBe('No motion found for group: nonexistent');
    });

    it('should handle motion playing errors', async () => {
      mockLive2DService.playMotion.mockRejectedValue(new Error('Motion failed'));

      const action = await store.dispatch(playMotion({group: 'idle'}));

      expect(playMotion.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.error).toBe('Motion failed');
    });

    it('should handle lip sync starting', async () => {
      const audioData = new ArrayBuffer(1024);
      const action = await store.dispatch(startLipSync({audioData, sensitivity: 0.8}));

      expect(startLipSync.fulfilled.match(action)).toBe(true);
      expect(mockLive2DService.startLipSync).toHaveBeenCalledWith(audioData, 0.8);
    });

    it('should handle lip sync errors', async () => {
      mockLive2DService.startLipSync.mockImplementation(() => {
        throw new Error('Lip sync failed');
      });

      const audioData = new ArrayBuffer(1024);
      const action = await store.dispatch(startLipSync({audioData}));

      expect(startLipSync.rejected.match(action)).toBe(true);

      const state = store.getState().live2d;
      expect(state.error).toBe('Lip sync failed');
    });
  });

  describe('Loading States', () => {
    it('should set loading state during initialization', () => {
      mockLive2DService.initialize.mockImplementation(() => new Promise(resolve => {}));

      store.dispatch(initializeLive2D());

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set loading state during model loading', () => {
      mockLive2DService.loadModel.mockImplementation(() => new Promise(resolve => {}));

      store.dispatch(loadModel({characterId: 'aoi'}));

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear loading state after success', async () => {
      await store.dispatch(initializeLive2D());

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
    });

    it('should clear loading state after error', async () => {
      mockLive2DService.initialize.mockRejectedValue(new Error('Failed'));

      await store.dispatch(initializeLive2D());

      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed');
    });
  });

  describe('Error Handling', () => {
    it('should set error for initialization failure', async () => {
      mockLive2DService.initialize.mockRejectedValue(new Error('Init failed'));

      await store.dispatch(initializeLive2D());

      const state = store.getState().live2d;
      expect(state.error).toBe('Init failed');
    });

    it('should set error for model loading failure', async () => {
      mockLive2DService.loadModel.mockRejectedValue(new Error('Load failed'));

      await store.dispatch(loadModel({characterId: 'aoi'}));

      const state = store.getState().live2d;
      expect(state.error).toBe('Load failed');
    });

    it('should set error for expression setting failure', async () => {
      mockLive2DService.setExpression.mockRejectedValue(new Error('Expression failed'));

      await store.dispatch(setExpression({emotion: 'happy'}));

      const state = store.getState().live2d;
      expect(state.error).toBe('Expression failed');
    });

    it('should set error for motion playing failure', async () => {
      mockLive2DService.playMotion.mockRejectedValue(new Error('Motion failed'));

      await store.dispatch(playMotion({group: 'idle'}));

      const state = store.getState().live2d;
      expect(state.error).toBe('Motion failed');
    });

    it('should set error for lip sync failure', async () => {
      mockLive2DService.startLipSync.mockImplementation(() => {
        throw new Error('Lip sync failed');
      });

      const audioData = new ArrayBuffer(1024);
      await store.dispatch(startLipSync({audioData}));

      const state = store.getState().live2d;
      expect(state.error).toBe('Lip sync failed');
    });

    it('should handle generic error messages', async () => {
      mockLive2DService.initialize.mockRejectedValue(new Error());

      await store.dispatch(initializeLive2D());

      const state = store.getState().live2d;
      expect(state.error).toBe('Failed to initialize Live2D');
    });
  });
});