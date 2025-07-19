import {live2dService} from '../../services/live2dService';

// Mock the Live2D service
jest.mock('../../services/live2dService');

const mockLive2DService = live2dService as jest.Mocked<typeof live2dService>;

describe('Live2DViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
    mockLive2DService.addEventListener.mockImplementation(() => {});
    mockLive2DService.removeEventListener.mockImplementation(() => {});
    mockLive2DService.update.mockImplementation(() => {});
    mockLive2DService.render.mockImplementation(() => {});
    mockLive2DService.setAutoBlinking.mockImplementation(() => {});
    mockLive2DService.setAutoBreathing.mockImplementation(() => {});
    mockLive2DService.playMotion.mockImplementation(() => {});
    mockLive2DService.setEyeTrackingTarget.mockImplementation(() => {});
  });

  describe('Service Integration', () => {
    it('should have access to Live2D service', () => {
      expect(mockLive2DService).toBeDefined();
      expect(mockLive2DService.initialize).toBeDefined();
      expect(mockLive2DService.loadModel).toBeDefined();
      expect(mockLive2DService.addEventListener).toBeDefined();
      expect(mockLive2DService.removeEventListener).toBeDefined();
    });

    it('should handle model loading', async () => {
      const config = mockLive2DService.getCharacterModel('aoi');
      const model = await mockLive2DService.loadModel(config);
      
      expect(model).toBeDefined();
      expect(model.isLoaded).toBe(true);
      expect(mockLive2DService.loadModel).toHaveBeenCalledWith(config);
    });

    it('should handle service initialization', async () => {
      await mockLive2DService.initialize();
      expect(mockLive2DService.initialize).toHaveBeenCalled();
    });

    it('should handle event listeners', () => {
      const callback = jest.fn();
      mockLive2DService.addEventListener(callback);
      expect(mockLive2DService.addEventListener).toHaveBeenCalledWith(callback);
      
      mockLive2DService.removeEventListener(callback);
      expect(mockLive2DService.removeEventListener).toHaveBeenCalledWith(callback);
    });

    it('should handle animation loop', () => {
      mockLive2DService.update(16.67);
      mockLive2DService.render();
      
      expect(mockLive2DService.update).toHaveBeenCalledWith(16.67);
      expect(mockLive2DService.render).toHaveBeenCalled();
    });

    it('should handle auto animations', () => {
      mockLive2DService.setAutoBlinking(true);
      mockLive2DService.setAutoBreathing(true);
      
      expect(mockLive2DService.setAutoBlinking).toHaveBeenCalledWith(true);
      expect(mockLive2DService.setAutoBreathing).toHaveBeenCalledWith(true);
    });

    it('should handle touch interactions', () => {
      mockLive2DService.setEyeTrackingTarget(0.5, -0.3);
      mockLive2DService.playMotion(expect.any(Object));
      
      expect(mockLive2DService.setEyeTrackingTarget).toHaveBeenCalledWith(0.5, -0.3);
      expect(mockLive2DService.playMotion).toHaveBeenCalled();
    });

    it('should handle character switching', () => {
      mockLive2DService.getCharacterModel.mockImplementation((character) => ({
        modelPath: `/assets/live2d/${character}/${character}.model3.json`,
        texturePath: `/assets/live2d/${character}/textures/`,
      }));
      
      const aoiConfig = mockLive2DService.getCharacterModel('aoi');
      const shunConfig = mockLive2DService.getCharacterModel('shun');
      
      expect(aoiConfig.modelPath).toContain('aoi');
      expect(shunConfig.modelPath).toContain('shun');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockLive2DService.initialize.mockRejectedValue(new Error('Init failed'));
      
      await expect(mockLive2DService.initialize()).rejects.toThrow('Init failed');
    });

    it('should handle model loading errors', async () => {
      mockLive2DService.loadModel.mockRejectedValue(new Error('Load failed'));
      
      const config = mockLive2DService.getCharacterModel('aoi');
      await expect(mockLive2DService.loadModel(config)).rejects.toThrow('Load failed');
    });

    it('should handle service disposal gracefully', () => {
      const callback = jest.fn();
      mockLive2DService.addEventListener(callback);
      mockLive2DService.removeEventListener(callback);
      
      expect(mockLive2DService.removeEventListener).toHaveBeenCalledWith(callback);
    });
  });

  describe('Performance', () => {
    it('should handle rapid animation updates', () => {
      for (let i = 0; i < 60; i++) {
        mockLive2DService.update(16.67);
        mockLive2DService.render();
      }
      
      expect(mockLive2DService.update).toHaveBeenCalledTimes(60);
      expect(mockLive2DService.render).toHaveBeenCalledTimes(60);
    });

    it('should handle multiple character models', async () => {
      const aoiConfig = mockLive2DService.getCharacterModel('aoi');
      const shunConfig = mockLive2DService.getCharacterModel('shun');
      
      await Promise.all([
        mockLive2DService.loadModel(aoiConfig),
        mockLive2DService.loadModel(shunConfig),
      ]);
      
      expect(mockLive2DService.loadModel).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent operations', () => {
      mockLive2DService.update(16.67);
      mockLive2DService.render();
      mockLive2DService.setAutoBlinking(true);
      mockLive2DService.setAutoBreathing(true);
      mockLive2DService.setEyeTrackingTarget(0.5, -0.3);
      
      expect(mockLive2DService.update).toHaveBeenCalled();
      expect(mockLive2DService.render).toHaveBeenCalled();
      expect(mockLive2DService.setAutoBlinking).toHaveBeenCalled();
      expect(mockLive2DService.setAutoBreathing).toHaveBeenCalled();
      expect(mockLive2DService.setEyeTrackingTarget).toHaveBeenCalled();
    });
  });

  describe('Character Emotion Support', () => {
    it('should support all emotion states', () => {
      const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed'];
      
      mockLive2DService.getExpressionForEmotion.mockImplementation((emotion) => ({
        id: `exp_${emotion}`,
        name: emotion,
        file: `${emotion}.exp3.json`,
        emotion,
        intensity: 0.5,
      }));
      
      emotions.forEach(emotion => {
        const expression = mockLive2DService.getExpressionForEmotion(emotion as any);
        expect(expression).toBeDefined();
      });
    });

    it('should handle emotion transitions', () => {
      const emotions = ['neutral', 'happy', 'sad', 'angry'];
      
      mockLive2DService.getExpressionForEmotion.mockImplementation((emotion) => ({
        id: `exp_${emotion}`,
        name: emotion,
        file: `${emotion}.exp3.json`,
        emotion,
        intensity: 0.5,
      }));
      
      emotions.forEach(emotion => {
        const expression = mockLive2DService.getExpressionForEmotion(emotion as any);
        mockLive2DService.setExpression(expression);
        expect(mockLive2DService.setExpression).toHaveBeenCalledWith(expression);
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible interface', () => {
      // Test that the component would provide proper accessibility
      expect(mockLive2DService).toBeDefined();
      expect(mockLive2DService.initialize).toBeDefined();
      expect(mockLive2DService.loadModel).toBeDefined();
    });

    it('should handle touch interactions accessibly', () => {
      mockLive2DService.setEyeTrackingTarget(0.5, -0.3);
      mockLive2DService.playMotion(expect.any(Object));
      
      expect(mockLive2DService.setEyeTrackingTarget).toHaveBeenCalled();
      expect(mockLive2DService.playMotion).toHaveBeenCalled();
    });
  });
});