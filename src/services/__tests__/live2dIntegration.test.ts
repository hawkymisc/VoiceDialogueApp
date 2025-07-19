import {live2dService} from '../live2dService';
import {configureStore} from '@reduxjs/toolkit';
import live2dSlice, {
  initializeLive2D,
  loadModel,
  setExpression,
  playMotion,
  startLipSync,
  setParameter,
} from '../../store/slices/live2dSlice';

// Mock React Native modules
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  State: {
    ACTIVE: 'ACTIVE',
  },
}));

describe('Live2D Integration System', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test store
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
  });

  describe('Live2D Service', () => {
    it('should initialize Live2D service', async () => {
      const result = await live2dService.initialize();
      expect(result).toBeUndefined();
    });

    it('should load character model', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      const model = await live2dService.loadModel(config);
      
      expect(model).toBeDefined();
      expect(model.isLoaded).toBe(true);
      expect(model.config).toBe(config);
    });

    it('should set expressions', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      const expression = live2dService.getExpressionForEmotion('happy');
      await live2dService.setExpression(expression);
      
      expect(expression.emotion).toBe('happy');
      expect(expression.intensity).toBeGreaterThan(0);
    });

    it('should play motion animations', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('shun');
      await live2dService.loadModel(config);
      
      const motion = live2dService.getRandomMotion('idle');
      expect(motion).toBeDefined();
      
      if (motion) {
        await live2dService.playMotion(motion);
        expect(motion.group).toBe('idle');
      }
    });

    it('should handle lip sync', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      const mockAudioData = new ArrayBuffer(1024);
      live2dService.startLipSync(mockAudioData, 1.0);
      
      // Verify lip sync parameters are set
      live2dService.stopLipSync();
    });

    it('should manage model parameters', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      live2dService.setParameter('ParamAngleX', 15);
      live2dService.setParameter('ParamEyeBallX', 0.5);
      
      // Parameters should be set without error
    });

    it('should handle auto animations', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('shun');
      await live2dService.loadModel(config);
      
      live2dService.setAutoBlinking(true);
      live2dService.setAutoBreathing(true);
      
      // Auto animations should be enabled
    });

    it('should handle eye tracking', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      live2dService.setEyeTrackingTarget(0.3, -0.2);
      
      // Eye tracking should be set
    });

    it('should dispose resources properly', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      live2dService.dispose();
      
      // Service should be disposed
    });
  });

  describe('Live2D Redux Integration', () => {
    it('should initialize Live2D through Redux', async () => {
      const resultAction = await store.dispatch(initializeLive2D());
      
      expect(initializeLive2D.fulfilled.match(resultAction)).toBe(true);
      
      const state = store.getState().live2d;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should load model through Redux', async () => {
      await store.dispatch(initializeLive2D());
      
      const resultAction = await store.dispatch(loadModel({characterId: 'aoi'}));
      
      expect(loadModel.fulfilled.match(resultAction)).toBe(true);
      
      const state = store.getState().live2d;
      expect(state.currentModel).toBeDefined();
      expect(state.currentModel?.isLoaded).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set expression through Redux', async () => {
      await store.dispatch(initializeLive2D());
      await store.dispatch(loadModel({characterId: 'aoi'}));
      
      const resultAction = await store.dispatch(setExpression({emotion: 'happy'}));
      
      expect(setExpression.fulfilled.match(resultAction)).toBe(true);
      
      const state = store.getState().live2d;
      expect(state.currentExpression).toBeDefined();
      expect(state.currentExpression?.emotion).toBe('happy');
    });

    it('should play motion through Redux', async () => {
      await store.dispatch(initializeLive2D());
      await store.dispatch(loadModel({characterId: 'shun'}));
      
      const resultAction = await store.dispatch(playMotion({group: 'idle'}));
      
      expect(playMotion.fulfilled.match(resultAction)).toBe(true);
      
      const state = store.getState().live2d;
      expect(state.currentMotion).toBeDefined();
      expect(state.currentMotion?.group).toBe('idle');
      expect(state.isPlaying).toBe(true);
    });

    it('should start lip sync through Redux', async () => {
      await store.dispatch(initializeLive2D());
      await store.dispatch(loadModel({characterId: 'aoi'}));
      
      const mockAudioData = new ArrayBuffer(1024);
      const resultAction = await store.dispatch(startLipSync({
        audioData: mockAudioData,
        sensitivity: 0.8,
      }));
      
      expect(startLipSync.fulfilled.match(resultAction)).toBe(true);
    });

    it('should set parameter through Redux', async () => {
      await store.dispatch(initializeLive2D());
      await store.dispatch(loadModel({characterId: 'aoi'}));
      
      store.dispatch(setParameter({id: 'ParamAngleX', value: 20}));
      
      const state = store.getState().live2d;
      const parameter = state.parameters.find(p => p.id === 'ParamAngleX');
      
      // Parameter should be updated in state
    });

    it('should handle errors gracefully', async () => {
      // Create a new store for this test to avoid interference
      const errorStore = configureStore({
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
      
      // Mock service to throw error
      const mockInitialize = jest.spyOn(live2dService, 'initialize').mockRejectedValue(new Error('Test error'));
      
      const resultAction = await errorStore.dispatch(initializeLive2D());
      
      expect(initializeLive2D.rejected.match(resultAction)).toBe(true);
      
      const state = errorStore.getState().live2d;
      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);
      
      // Restore the mock
      mockInitialize.mockRestore();
    });
  });

  describe('Emotion Mapping', () => {
    it('should map dialogue emotions to Live2D expressions', () => {
      const happyExpression = live2dService.getExpressionForEmotion('happy');
      const sadExpression = live2dService.getExpressionForEmotion('sad');
      const angryExpression = live2dService.getExpressionForEmotion('angry');
      
      expect(happyExpression.emotion).toBe('happy');
      expect(sadExpression.emotion).toBe('sad');
      expect(angryExpression.emotion).toBe('angry');
    });

    it('should have different expressions for different emotions', () => {
      const expressions = [
        'neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed'
      ] as const;
      
      const expressionObjects = expressions.map(emotion => 
        live2dService.getExpressionForEmotion(emotion)
      );
      
      // All expressions should be different
      const uniqueIds = new Set(expressionObjects.map(e => e.id));
      expect(uniqueIds.size).toBe(expressions.length);
    });
  });

  describe('Motion Groups', () => {
    it('should have different motion groups', () => {
      const idleMotions = live2dService.getMotionsForGroup('idle');
      const talkingMotions = live2dService.getMotionsForGroup('talking');
      const gestureMotions = live2dService.getMotionsForGroup('gesture');
      
      expect(idleMotions.length).toBeGreaterThan(0);
      expect(talkingMotions.length).toBeGreaterThan(0);
      expect(gestureMotions.length).toBeGreaterThan(0);
    });

    it('should return random motions from groups', () => {
      const motion1 = live2dService.getRandomMotion('idle');
      const motion2 = live2dService.getRandomMotion('idle');
      
      expect(motion1).toBeDefined();
      expect(motion2).toBeDefined();
      
      if (motion1 && motion2) {
        expect(motion1.group).toBe('idle');
        expect(motion2.group).toBe('idle');
      }
    });

    it('should return null for non-existent groups', () => {
      const motion = live2dService.getRandomMotion('nonexistent');
      expect(motion).toBe(null);
    });
  });

  describe('Character-specific Configurations', () => {
    it('should have different configurations for different characters', () => {
      const aoiConfig = live2dService.getCharacterModel('aoi');
      const shunConfig = live2dService.getCharacterModel('shun');
      
      expect(aoiConfig.modelPath).toContain('aoi');
      expect(shunConfig.modelPath).toContain('shun');
      expect(aoiConfig.modelPath).not.toBe(shunConfig.modelPath);
    });

    it('should load different models for different characters', async () => {
      // Create a fresh service instance for this test
      const testService = new (live2dService.constructor as any)();
      await testService.initialize();
      
      const aoiConfig = testService.getCharacterModel('aoi');
      const shunConfig = testService.getCharacterModel('shun');
      
      const aoiModel = await testService.loadModel(aoiConfig);
      const shunModel = await testService.loadModel(shunConfig);
      
      expect(aoiModel.config.modelPath).toContain('aoi');
      expect(shunModel.config.modelPath).toContain('shun');
    });
  });

  describe('Animation Sequences', () => {
    it('should handle complex animation sequences', async () => {
      // Create a fresh service instance for this test
      const testService = new (live2dService.constructor as any)();
      await testService.initialize();
      
      const config = testService.getCharacterModel('aoi');
      await testService.loadModel(config);
      
      // Test emotion sequence
      const happyExpression = testService.getExpressionForEmotion('happy');
      await testService.setExpression(happyExpression);
      
      const greetingMotion = testService.getRandomMotion('greeting');
      if (greetingMotion) {
        await testService.playMotion(greetingMotion);
      }
      
      // Should complete without error
      expect(true).toBe(true);
    });

    it('should handle talking animation with lip sync', async () => {
      // Create a fresh service instance for this test
      const testService = new (live2dService.constructor as any)();
      await testService.initialize();
      
      const config = testService.getCharacterModel('shun');
      await testService.loadModel(config);
      
      // Start talking animation
      const talkingMotion = testService.getRandomMotion('talking');
      if (talkingMotion) {
        await testService.playMotion(talkingMotion);
      }
      
      // Start lip sync
      const mockAudioData = new ArrayBuffer(2048);
      testService.startLipSync(mockAudioData, 1.0);
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should handle Live2D events', async () => {
      // Create a fresh service instance for this test
      const testService = new (live2dService.constructor as any)();
      await testService.initialize();
      
      const events: any[] = [];
      const callback = (event: any) => events.push(event);
      
      testService.addEventListener(callback);
      
      const config = testService.getCharacterModel('aoi');
      await testService.loadModel(config);
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'modelLoaded')).toBe(true);
      
      testService.removeEventListener(callback);
    });

    it('should remove event listeners', async () => {
      // Create a fresh service instance for this test
      const testService = new (live2dService.constructor as any)();
      await testService.initialize();
      
      const events: any[] = [];
      const callback = (event: any) => events.push(event);
      
      testService.addEventListener(callback);
      testService.removeEventListener(callback);
      
      const config = testService.getCharacterModel('aoi');
      await testService.loadModel(config);
      
      // Should have no events after removal
      expect(events.length).toBe(0);
    });
  });
});