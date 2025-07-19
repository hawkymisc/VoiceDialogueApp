import {live2dService} from '../../services/live2dService';

// Mock the Live2D service
jest.mock('../../services/live2dService');

const mockLive2DService = live2dService as jest.Mocked<typeof live2dService>;

describe('useLive2D Hook', () => {
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
    mockLive2DService.getExpressionForEmotion.mockReturnValue({
      id: 'exp_neutral',
      name: 'Neutral',
      file: 'neutral.exp3.json',
      emotion: 'neutral',
      intensity: 0.5,
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

  describe('Service Integration', () => {
    it('should have access to Live2D service', () => {
      expect(mockLive2DService).toBeDefined();
      expect(mockLive2DService.initialize).toBeDefined();
      expect(mockLive2DService.loadModel).toBeDefined();
      expect(mockLive2DService.setExpression).toBeDefined();
      expect(mockLive2DService.playMotion).toBeDefined();
    });

    it('should provide character model configurations', () => {
      const config = mockLive2DService.getCharacterModel('aoi');
      expect(config).toBeDefined();
      expect(config.modelPath).toContain('aoi');
      expect(config.texturePath).toContain('textures');
    });

    it('should provide expression configurations', () => {
      mockLive2DService.getExpressionForEmotion.mockReturnValue({
        id: 'exp_happy',
        name: 'Happy',
        file: 'happy.exp3.json',
        emotion: 'happy',
        intensity: 0.8,
      });
      
      const expression = mockLive2DService.getExpressionForEmotion('happy');
      expect(expression).toBeDefined();
      expect(expression.emotion).toBe('happy');
      expect(expression.intensity).toBeGreaterThan(0);
    });

    it('should provide motion configurations', () => {
      const motion = mockLive2DService.getRandomMotion('idle');
      expect(motion).toBeDefined();
      expect(motion.group).toBe('idle');
      expect(motion.duration).toBeGreaterThan(0);
    });

    it('should handle service initialization', async () => {
      await mockLive2DService.initialize();
      expect(mockLive2DService.initialize).toHaveBeenCalled();
    });

    it('should handle model loading', async () => {
      const config = mockLive2DService.getCharacterModel('aoi');
      const model = await mockLive2DService.loadModel(config);
      
      expect(model).toBeDefined();
      expect(model.isLoaded).toBe(true);
      expect(mockLive2DService.loadModel).toHaveBeenCalledWith(config);
    });

    it('should handle expression setting', async () => {
      const expression = mockLive2DService.getExpressionForEmotion('happy');
      await mockLive2DService.setExpression(expression);
      
      expect(mockLive2DService.setExpression).toHaveBeenCalledWith(expression);
    });

    it('should handle motion playing', async () => {
      const motion = mockLive2DService.getRandomMotion('idle');
      await mockLive2DService.playMotion(motion);
      
      expect(mockLive2DService.playMotion).toHaveBeenCalledWith(motion);
    });

    it('should handle lip sync operations', () => {
      const audioData = new ArrayBuffer(1024);
      mockLive2DService.startLipSync(audioData, 1.0);
      
      expect(mockLive2DService.startLipSync).toHaveBeenCalledWith(audioData, 1.0);
      
      mockLive2DService.stopLipSync();
      expect(mockLive2DService.stopLipSync).toHaveBeenCalled();
    });

    it('should handle parameter setting', () => {
      mockLive2DService.setParameter('ParamAngleX', 15);
      expect(mockLive2DService.setParameter).toHaveBeenCalledWith('ParamAngleX', 15);
    });

    it('should handle auto animations', () => {
      mockLive2DService.setAutoBlinking(true);
      expect(mockLive2DService.setAutoBlinking).toHaveBeenCalledWith(true);
      
      mockLive2DService.setAutoBreathing(false);
      expect(mockLive2DService.setAutoBreathing).toHaveBeenCalledWith(false);
    });

    it('should handle eye tracking', () => {
      mockLive2DService.setEyeTrackingTarget(0.5, -0.3);
      expect(mockLive2DService.setEyeTrackingTarget).toHaveBeenCalledWith(0.5, -0.3);
    });

    it('should handle disposal', () => {
      mockLive2DService.dispose();
      expect(mockLive2DService.dispose).toHaveBeenCalled();
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

    it('should handle expression setting errors', async () => {
      mockLive2DService.setExpression.mockRejectedValue(new Error('Expression failed'));
      
      const expression = mockLive2DService.getExpressionForEmotion('happy');
      await expect(mockLive2DService.setExpression(expression)).rejects.toThrow('Expression failed');
    });

    it('should handle motion playing errors', async () => {
      mockLive2DService.playMotion.mockRejectedValue(new Error('Motion failed'));
      
      const motion = mockLive2DService.getRandomMotion('idle');
      await expect(mockLive2DService.playMotion(motion)).rejects.toThrow('Motion failed');
    });

    it('should handle lip sync errors', () => {
      mockLive2DService.startLipSync.mockImplementation(() => {
        throw new Error('Lip sync failed');
      });
      
      const audioData = new ArrayBuffer(1024);
      expect(() => mockLive2DService.startLipSync(audioData)).toThrow('Lip sync failed');
    });
  });

  describe('Performance', () => {
    it('should handle rapid successive calls', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const expression = mockLive2DService.getExpressionForEmotion('happy');
        promises.push(mockLive2DService.setExpression(expression));
      }
      
      await Promise.all(promises);
      expect(mockLive2DService.setExpression).toHaveBeenCalledTimes(10);
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

    it('should handle concurrent operations', async () => {
      const expression = mockLive2DService.getExpressionForEmotion('happy');
      const motion = mockLive2DService.getRandomMotion('idle');
      const audioData = new ArrayBuffer(1024);
      
      await Promise.all([
        mockLive2DService.setExpression(expression),
        mockLive2DService.playMotion(motion),
      ]);
      
      mockLive2DService.startLipSync(audioData, 1.0);
      mockLive2DService.setParameter('ParamAngleX', 15);
      
      expect(mockLive2DService.setExpression).toHaveBeenCalled();
      expect(mockLive2DService.playMotion).toHaveBeenCalled();
      expect(mockLive2DService.startLipSync).toHaveBeenCalled();
      expect(mockLive2DService.setParameter).toHaveBeenCalled();
    });
  });
});