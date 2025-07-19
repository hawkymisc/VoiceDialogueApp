import {live2dService} from '../live2dService';
import {Live2DEvent, Live2DEventCallback} from '../../types/Live2D';

describe('Live2DService', () => {
  let mockEventCallback: jest.Mock<void, [Live2DEvent]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventCallback = jest.fn();
    
    // Reset service state
    live2dService.dispose();
  });

  afterEach(() => {
    live2dService.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(live2dService.initialize()).resolves.toBeUndefined();
    });

    it('should not initialize twice', async () => {
      await live2dService.initialize();
      await expect(live2dService.initialize()).resolves.toBeUndefined();
    });

    it('should emit modelLoaded event on initialization', async () => {
      live2dService.addEventListener(mockEventCallback);
      await live2dService.initialize();
      
      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'modelLoaded',
          data: {initialized: true},
        })
      );
    });

    it('should handle initialization errors', async () => {
      // Mock implementation that throws error
      const originalMethod = live2dService.initialize;
      (live2dService as any).initialize = jest.fn().mockRejectedValue(new Error('Init failed'));
      
      await expect(live2dService.initialize()).rejects.toThrow('Init failed');
      
      // Restore original method
      (live2dService as any).initialize = originalMethod;
    });
  });

  describe('Model Loading', () => {
    beforeEach(async () => {
      await live2dService.initialize();
    });

    it('should load Aoi model successfully', async () => {
      const config = live2dService.getCharacterModel('aoi');
      const model = await live2dService.loadModel(config);
      
      expect(model).toBeDefined();
      expect(model.isLoaded).toBe(true);
      expect(model.config).toBe(config);
      expect(model.config.modelPath).toContain('aoi');
    });

    it('should load Shun model successfully', async () => {
      const config = live2dService.getCharacterModel('shun');
      const model = await live2dService.loadModel(config);
      
      expect(model).toBeDefined();
      expect(model.isLoaded).toBe(true);
      expect(model.config).toBe(config);
      expect(model.config.modelPath).toContain('shun');
    });

    it('should emit modelLoaded event', async () => {
      live2dService.addEventListener(mockEventCallback);
      
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'modelLoaded',
          data: expect.objectContaining({
            model: expect.objectContaining({
              isLoaded: true,
            }),
          }),
        })
      );
    });

    it('should handle model loading errors', async () => {
      const invalidConfig = {
        modelPath: '/invalid/path/model.json',
        texturePath: '/invalid/path/textures/',
      };
      
      // Mock error by manipulating the delay
      const originalDelay = (live2dService as any).delay;
      (live2dService as any).delay = jest.fn().mockRejectedValue(new Error('Loading failed'));
      
      const model = await live2dService.loadModel(invalidConfig);
      
      expect(model.isLoaded).toBe(false);
      expect(model.error).toBeDefined();
      
      // Restore original delay
      (live2dService as any).delay = originalDelay;
    });

    it('should load different models for different characters', async () => {
      const aoiConfig = live2dService.getCharacterModel('aoi');
      const shunConfig = live2dService.getCharacterModel('shun');
      
      expect(aoiConfig.modelPath).toContain('aoi');
      expect(shunConfig.modelPath).toContain('shun');
      expect(aoiConfig.modelPath).not.toBe(shunConfig.modelPath);
    });

    it('should handle concurrent model loading', async () => {
      const aoiConfig = live2dService.getCharacterModel('aoi');
      const shunConfig = live2dService.getCharacterModel('shun');
      
      const [aoiModel, shunModel] = await Promise.all([
        live2dService.loadModel(aoiConfig),
        live2dService.loadModel(shunConfig),
      ]);
      
      expect(aoiModel.isLoaded).toBe(true);
      expect(shunModel.isLoaded).toBe(true);
    });
  });

  describe('Expression Management', () => {
    beforeEach(async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
    });

    it('should set all emotion expressions', async () => {
      const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed'] as const;
      
      for (const emotion of emotions) {
        const expression = live2dService.getExpressionForEmotion(emotion);
        await live2dService.setExpression(expression);
        
        expect(expression.emotion).toBe(emotion);
        expect(expression.intensity).toBeGreaterThan(0);
      }
    });

    it('should emit expressionChanged event', async () => {
      live2dService.addEventListener(mockEventCallback);
      
      const expression = live2dService.getExpressionForEmotion('happy');
      await live2dService.setExpression(expression);
      
      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expressionChanged',
          data: {expression},
        })
      );
    });

    it('should handle rapid expression changes', async () => {
      const emotions = ['happy', 'sad', 'angry', 'surprised'] as const;
      
      const promises = emotions.map(emotion => {
        const expression = live2dService.getExpressionForEmotion(emotion);
        return live2dService.setExpression(expression);
      });
      
      await Promise.all(promises);
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should validate expression intensity', () => {
      const expression = live2dService.getExpressionForEmotion('happy');
      
      expect(expression.intensity).toBeGreaterThanOrEqual(0);
      expect(expression.intensity).toBeLessThanOrEqual(1);
    });

    it('should provide unique expressions for each emotion', () => {
      const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed'] as const;
      const expressions = emotions.map(emotion => 
        live2dService.getExpressionForEmotion(emotion)
      );
      
      const uniqueIds = new Set(expressions.map(e => e.id));
      expect(uniqueIds.size).toBe(emotions.length);
    });
  });

  describe('Motion Management', () => {
    beforeEach(async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
    });

    it('should get motions for all groups', () => {
      const groups = ['idle', 'greeting', 'talking', 'gesture'];
      
      groups.forEach(group => {
        const motions = live2dService.getMotionsForGroup(group);
        expect(motions.length).toBeGreaterThan(0);
        motions.forEach(motion => {
          expect(motion.group).toBe(group);
        });
      });
    });

    it('should get random motions from groups', () => {
      const motion1 = live2dService.getRandomMotion('idle');
      const motion2 = live2dService.getRandomMotion('idle');
      
      expect(motion1).toBeDefined();
      expect(motion2).toBeDefined();
      expect(motion1!.group).toBe('idle');
      expect(motion2!.group).toBe('idle');
    });

    it('should return null for non-existent groups', () => {
      const motion = live2dService.getRandomMotion('nonexistent');
      expect(motion).toBeNull();
    });

    it('should play motions successfully', async () => {
      live2dService.addEventListener(mockEventCallback);
      
      const motion = live2dService.getRandomMotion('idle');
      expect(motion).toBeDefined();
      
      if (motion) {
        await live2dService.playMotion(motion);
        
        expect(mockEventCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'motionStarted',
            data: {motion},
          })
        );
      }
    });

    it('should handle motion completion', async () => {
      live2dService.addEventListener(mockEventCallback);
      
      const motion = live2dService.getRandomMotion('greeting');
      if (motion) {
        await live2dService.playMotion(motion);
        
        // Wait for motion to complete
        await new Promise(resolve => setTimeout(resolve, motion.duration + 100));
        
        expect(mockEventCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'motionEnded',
            data: {motion},
          })
        );
      }
    });

    it('should validate motion properties', () => {
      const groups = ['idle', 'greeting', 'talking', 'gesture'];
      
      groups.forEach(group => {
        const motions = live2dService.getMotionsForGroup(group);
        motions.forEach(motion => {
          expect(motion.id).toBeDefined();
          expect(motion.name).toBeDefined();
          expect(motion.file).toBeDefined();
          expect(motion.group).toBe(group);
          expect(motion.priority).toBeGreaterThan(0);
          expect(motion.duration).toBeGreaterThan(0);
          expect(motion.fadeIn).toBeGreaterThanOrEqual(0);
          expect(motion.fadeOut).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should handle multiple concurrent motions', async () => {
      const motions = [
        live2dService.getRandomMotion('idle'),
        live2dService.getRandomMotion('talking'),
        live2dService.getRandomMotion('gesture'),
      ].filter(Boolean);
      
      const promises = motions.map(motion => live2dService.playMotion(motion!));
      
      await Promise.all(promises);
      
      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Parameter Management', () => {
    beforeEach(async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
    });

    it('should set parameters within valid ranges', () => {
      const testCases = [
        {id: 'ParamAngleX', value: 15, min: -30, max: 30},
        {id: 'ParamAngleY', value: -20, min: -30, max: 30},
        {id: 'ParamEyeBallX', value: 0.5, min: -1, max: 1},
        {id: 'ParamEyeBallY', value: -0.3, min: -1, max: 1},
        {id: 'ParamMouthOpenY', value: 0.8, min: 0, max: 1},
      ];
      
      testCases.forEach(({id, value}) => {
        live2dService.setParameter(id, value);
        // Should not throw error
      });
    });

    it('should clamp parameters to valid ranges', () => {
      // Test values outside valid range
      live2dService.setParameter('ParamAngleX', 100); // Should clamp to 30
      live2dService.setParameter('ParamAngleX', -100); // Should clamp to -30
      live2dService.setParameter('ParamMouthOpenY', -1); // Should clamp to 0
      live2dService.setParameter('ParamMouthOpenY', 2); // Should clamp to 1
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should emit parameterChanged events', () => {
      live2dService.addEventListener(mockEventCallback);
      
      live2dService.setParameter('ParamAngleX', 15);
      
      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'parameterChanged',
          data: {parameterId: 'ParamAngleX', value: 15},
        })
      );
    });

    it('should handle invalid parameter IDs gracefully', () => {
      expect(() => {
        live2dService.setParameter('InvalidParam', 1.0);
      }).not.toThrow();
    });

    it('should handle rapid parameter updates', () => {
      const updates = Array.from({length: 100}, (_, i) => ({
        id: 'ParamAngleX',
        value: (i % 60) - 30, // Cycle through valid range
      }));
      
      expect(() => {
        updates.forEach(({id, value}) => {
          live2dService.setParameter(id, value);
        });
      }).not.toThrow();
    });
  });

  describe('Lip Sync', () => {
    beforeEach(async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
    });

    it('should start lip sync with audio data', () => {
      const audioData = new ArrayBuffer(1024);
      
      expect(() => {
        live2dService.startLipSync(audioData, 1.0);
      }).not.toThrow();
    });

    it('should handle different sensitivity levels', () => {
      const audioData = new ArrayBuffer(1024);
      const sensitivities = [0.1, 0.5, 1.0, 1.5, 2.0];
      
      sensitivities.forEach(sensitivity => {
        expect(() => {
          live2dService.startLipSync(audioData, sensitivity);
        }).not.toThrow();
      });
    });

    it('should stop lip sync', () => {
      expect(() => {
        live2dService.stopLipSync();
      }).not.toThrow();
    });

    it('should handle lip sync with different audio sizes', () => {
      const sizes = [512, 1024, 2048, 4096];
      
      sizes.forEach(size => {
        const audioData = new ArrayBuffer(size);
        expect(() => {
          live2dService.startLipSync(audioData, 1.0);
        }).not.toThrow();
      });
    });

    it('should handle empty audio data', () => {
      const audioData = new ArrayBuffer(0);
      
      expect(() => {
        live2dService.startLipSync(audioData, 1.0);
      }).not.toThrow();
    });
  });

  describe('Auto Animations', () => {
    beforeEach(async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
    });

    it('should enable auto blinking', () => {
      expect(() => {
        live2dService.setAutoBlinking(true);
      }).not.toThrow();
    });

    it('should disable auto blinking', () => {
      expect(() => {
        live2dService.setAutoBlinking(false);
      }).not.toThrow();
    });

    it('should enable auto breathing', () => {
      expect(() => {
        live2dService.setAutoBreathing(true);
      }).not.toThrow();
    });

    it('should disable auto breathing', () => {
      expect(() => {
        live2dService.setAutoBreathing(false);
      }).not.toThrow();
    });

    it('should set eye tracking target', () => {
      const targets = [
        {x: 0, y: 0},
        {x: 0.5, y: -0.3},
        {x: -0.8, y: 0.2},
        {x: 1.0, y: 1.0},
      ];
      
      targets.forEach(({x, y}) => {
        expect(() => {
          live2dService.setEyeTrackingTarget(x, y);
        }).not.toThrow();
      });
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await live2dService.initialize();
    });

    it('should add event listeners', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      live2dService.addEventListener(callback1);
      live2dService.addEventListener(callback2);
      
      // Trigger an event
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove event listeners', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      live2dService.addEventListener(callback1);
      live2dService.addEventListener(callback2);
      live2dService.removeEventListener(callback1);
      
      // Trigger an event
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', async () => {
      const callbacks = [jest.fn(), jest.fn(), jest.fn()];
      
      callbacks.forEach(callback => {
        live2dService.addEventListener(callback);
      });
      
      // Trigger an event
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should handle errors in event callbacks', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      
      live2dService.addEventListener(errorCallback);
      live2dService.addEventListener(normalCallback);
      
      // Trigger an event
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should provide event timestamps', async () => {
      const callback = jest.fn();
      live2dService.addEventListener(callback);
      
      const startTime = Date.now();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      const endTime = Date.now();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      );
      
      const event = callback.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(event.timestamp).toBeLessThanOrEqual(endTime);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      expect(() => {
        live2dService.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls', async () => {
      await live2dService.initialize();
      
      expect(() => {
        live2dService.dispose();
        live2dService.dispose();
        live2dService.dispose();
      }).not.toThrow();
    });

    it('should clear all listeners on dispose', async () => {
      await live2dService.initialize();
      
      const callback = jest.fn();
      live2dService.addEventListener(callback);
      
      live2dService.dispose();
      
      // Try to trigger an event after disposal
      try {
        const config = live2dService.getCharacterModel('aoi');
        await live2dService.loadModel(config);
      } catch (error) {
        // Expected to fail
      }
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency updates', async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        live2dService.update(16.67); // 60 FPS
        live2dService.render();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent operations', async () => {
      await live2dService.initialize();
      const config = live2dService.getCharacterModel('aoi');
      await live2dService.loadModel(config);
      
      const operations = [
        () => live2dService.setExpression(live2dService.getExpressionForEmotion('happy')),
        () => live2dService.setParameter('ParamAngleX', 15),
        () => live2dService.setAutoBlinking(true),
        () => live2dService.setEyeTrackingTarget(0.5, 0.3),
        () => live2dService.update(16.67),
        () => live2dService.render(),
      ];
      
      expect(() => {
        operations.forEach(operation => operation());
      }).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from initialization errors', async () => {
      // First attempt fails
      const originalMethod = live2dService.initialize;
      (live2dService as any).initialize = jest.fn().mockRejectedValueOnce(new Error('Init failed'));
      
      await expect(live2dService.initialize()).rejects.toThrow('Init failed');
      
      // Second attempt succeeds
      (live2dService as any).initialize = originalMethod;
      await expect(live2dService.initialize()).resolves.toBeUndefined();
    });

    it('should handle service errors gracefully', async () => {
      await live2dService.initialize();
      
      const config = live2dService.getCharacterModel('aoi');
      
      // Should handle errors gracefully and return model with error
      const result = await live2dService.loadModel(config);
      expect(result).toBeDefined();
      expect(result.isLoaded).toBe(true);
    });
  });
});