import {
  Live2DModel,
  Live2DModelConfig,
  Live2DExpression,
  Live2DMotion,
  Live2DParameter,
  Live2DAnimation,
  Live2DRenderConfig,
  Live2DEvent,
  Live2DEventCallback,
  Live2DLipSync,
  Live2DCharacterConfig,
  Live2DManager,
} from '../types/Live2D';
import {EmotionState} from '../types/Dialogue';
import {CharacterType} from '../types/Character';

/**
 * Live2D Service for managing character animations and expressions
 * Note: This is a mock implementation for development purposes.
 * In production, this would integrate with the actual Live2D Cubism SDK.
 */
class Live2DService implements Live2DManager {
  private isInitialized = false;
  private currentModel: Live2DModel | null = null;
  private currentExpression: Live2DExpression | null = null;
  private currentMotion: Live2DMotion | null = null;
  private parameters: Map<string, Live2DParameter> = new Map();
  private eventCallbacks: Live2DEventCallback[] = [];
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;

  // Character-specific model configurations
  private readonly CHARACTER_MODELS: Record<CharacterType, Live2DModelConfig> = {
    aoi: {
      modelPath: '/assets/live2d/aoi/aoi.model3.json',
      texturePath: '/assets/live2d/aoi/textures/',
      physicsPath: '/assets/live2d/aoi/aoi.physics3.json',
      posePath: '/assets/live2d/aoi/aoi.pose3.json',
      expressionPath: '/assets/live2d/aoi/expressions/',
      motionPath: '/assets/live2d/aoi/motions/',
    },
    shun: {
      modelPath: '/assets/live2d/shun/shun.model3.json',
      texturePath: '/assets/live2d/shun/textures/',
      physicsPath: '/assets/live2d/shun/shun.physics3.json',
      posePath: '/assets/live2d/shun/shun.pose3.json',
      expressionPath: '/assets/live2d/shun/expressions/',
      motionPath: '/assets/live2d/shun/motions/',
    },
  };

  // Expression definitions for each emotion
  private readonly EMOTION_EXPRESSIONS: Record<EmotionState, Live2DExpression> = {
    neutral: {
      id: 'exp_neutral',
      name: 'Neutral',
      file: 'neutral.exp3.json',
      emotion: 'neutral',
      intensity: 0.5,
    },
    happy: {
      id: 'exp_happy',
      name: 'Happy',
      file: 'happy.exp3.json',
      emotion: 'happy',
      intensity: 0.8,
    },
    sad: {
      id: 'exp_sad',
      name: 'Sad',
      file: 'sad.exp3.json',
      emotion: 'sad',
      intensity: 0.7,
    },
    angry: {
      id: 'exp_angry',
      name: 'Angry',
      file: 'angry.exp3.json',
      emotion: 'angry',
      intensity: 0.9,
    },
    surprised: {
      id: 'exp_surprised',
      name: 'Surprised',
      file: 'surprised.exp3.json',
      emotion: 'surprised',
      intensity: 0.8,
    },
    embarrassed: {
      id: 'exp_embarrassed',
      name: 'Embarrassed',
      file: 'embarrassed.exp3.json',
      emotion: 'embarrassed',
      intensity: 0.6,
    },
  };

  // Motion definitions for different actions
  private readonly MOTION_GROUPS: Record<string, Live2DMotion[]> = {
    idle: [
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
      {
        id: 'idle_02',
        name: 'Idle 2',
        file: 'idle_02.motion3.json',
        group: 'idle',
        priority: 1,
        loop: true,
        duration: 6000,
        fadeIn: 500,
        fadeOut: 500,
      },
    ],
    greeting: [
      {
        id: 'greeting_01',
        name: 'Greeting',
        file: 'greeting_01.motion3.json',
        group: 'greeting',
        priority: 2,
        loop: false,
        duration: 3000,
        fadeIn: 200,
        fadeOut: 500,
      },
    ],
    talking: [
      {
        id: 'talking_01',
        name: 'Talking 1',
        file: 'talking_01.motion3.json',
        group: 'talking',
        priority: 2,
        loop: false,
        duration: 4000,
        fadeIn: 200,
        fadeOut: 300,
      },
      {
        id: 'talking_02',
        name: 'Talking 2',
        file: 'talking_02.motion3.json',
        group: 'talking',
        priority: 2,
        loop: false,
        duration: 3500,
        fadeIn: 200,
        fadeOut: 300,
      },
    ],
    gesture: [
      {
        id: 'gesture_01',
        name: 'Gesture 1',
        file: 'gesture_01.motion3.json',
        group: 'gesture',
        priority: 3,
        loop: false,
        duration: 2500,
        fadeIn: 100,
        fadeOut: 200,
      },
    ],
  };

  /**
   * Initialize the Live2D service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Mock initialization process
      await this.delay(100);
      
      this.isInitialized = true;
      this.emitEvent('modelLoaded', {initialized: true});
      
      console.log('Live2D service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Live2D service:', error);
      this.emitEvent('error', {error: error instanceof Error ? error.message : 'Unknown error'});
      throw error;
    }
  }

  /**
   * Load a Live2D model
   */
  async loadModel(config: Live2DModelConfig): Promise<Live2DModel> {
    this.ensureInitialized();

    try {
      // Mock model loading process
      await this.delay(500);

      const model: Live2DModel = {
        id: `model_${Date.now()}`,
        name: config.modelPath.split('/').pop() || 'Unknown',
        config,
        isLoaded: true,
      };

      this.currentModel = model;
      this.initializeDefaultParameters();
      this.emitEvent('modelLoaded', {model});

      console.log(`Live2D model loaded: ${model.name}`);
      return model;
    } catch (error) {
      console.error('Failed to load Live2D model:', error);
      const errorModel: Live2DModel = {
        id: 'error',
        name: 'Error',
        config,
        isLoaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.emitEvent('error', {error: errorModel.error});
      return errorModel;
    }
  }

  /**
   * Set facial expression
   */
  async setExpression(expression: Live2DExpression): Promise<void> {
    this.ensureInitialized();

    try {
      // Mock expression change
      await this.delay(100);

      this.currentExpression = expression;
      this.emitEvent('expressionChanged', {expression});

      console.log(`Expression set to: ${expression.name}`);
    } catch (error) {
      console.error('Failed to set expression:', error);
      this.emitEvent('error', {error: error instanceof Error ? error.message : 'Unknown error'});
      throw error;
    }
  }

  /**
   * Play motion animation
   */
  async playMotion(motion: Live2DMotion): Promise<void> {
    this.ensureInitialized();

    try {
      // Mock motion playback
      this.currentMotion = motion;
      this.emitEvent('motionStarted', {motion});

      console.log(`Playing motion: ${motion.name}`);

      // Simulate motion completion
      setTimeout(() => {
        this.emitEvent('motionEnded', {motion});
        if (this.currentMotion?.id === motion.id) {
          this.currentMotion = null;
        }
      }, motion.duration);
    } catch (error) {
      console.error('Failed to play motion:', error);
      this.emitEvent('error', {error: error instanceof Error ? error.message : 'Unknown error'});
      throw error;
    }
  }

  /**
   * Set model parameter value
   */
  setParameter(parameterId: string, value: number): void {
    const parameter = this.parameters.get(parameterId);
    if (parameter) {
      const clampedValue = Math.max(parameter.min, Math.min(parameter.max, value));
      parameter.value = clampedValue;
      this.emitEvent('parameterChanged', {parameterId, value: clampedValue});
    }
  }

  /**
   * Update animation
   */
  update(deltaTime: number): void {
    if (!this.isInitialized || !this.currentModel) {
      return;
    }

    // Mock parameter updates (breathing, blinking, etc.)
    this.updateAutoParameters(deltaTime);
  }

  /**
   * Render the model
   */
  render(): void {
    if (!this.isInitialized || !this.currentModel) {
      return;
    }

    // Mock rendering process
    // In actual implementation, this would render to WebGL canvas
  }

  /**
   * Add event listener
   */
  addEventListener(callback: Live2DEventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback: Live2DEventCallback): void {
    this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.currentModel = null;
    this.currentExpression = null;
    this.currentMotion = null;
    this.parameters.clear();
    this.eventCallbacks = [];
    this.isInitialized = false;

    console.log('Live2D service disposed');
  }

  /**
   * Get character model configuration
   */
  getCharacterModel(characterId: CharacterType): Live2DModelConfig {
    return this.CHARACTER_MODELS[characterId];
  }

  /**
   * Get expression for emotion
   */
  getExpressionForEmotion(emotion: EmotionState): Live2DExpression {
    return this.EMOTION_EXPRESSIONS[emotion];
  }

  /**
   * Get motions for a group
   */
  getMotionsForGroup(group: string): Live2DMotion[] {
    return this.MOTION_GROUPS[group] || [];
  }

  /**
   * Get random motion from group
   */
  getRandomMotion(group: string): Live2DMotion | null {
    const motions = this.getMotionsForGroup(group);
    if (motions.length === 0) return null;
    return motions[Math.floor(Math.random() * motions.length)];
  }

  /**
   * Start lip sync with audio data
   */
  startLipSync(audioData: ArrayBuffer, sensitivity: number = 1.0): void {
    // Mock lip sync implementation
    console.log('Starting lip sync with sensitivity:', sensitivity);
    
    // Simulate lip sync parameter updates
    const lipSyncInterval = setInterval(() => {
      const lipValue = Math.random() * sensitivity;
      this.setParameter('ParamMouthOpenY', lipValue);
    }, 100);

    // Stop lip sync after estimated audio duration
    setTimeout(() => {
      clearInterval(lipSyncInterval);
      this.setParameter('ParamMouthOpenY', 0);
    }, audioData.byteLength / 1000); // Rough estimate
  }

  /**
   * Stop lip sync
   */
  stopLipSync(): void {
    this.setParameter('ParamMouthOpenY', 0);
    console.log('Lip sync stopped');
  }

  /**
   * Set eye tracking target
   */
  setEyeTrackingTarget(x: number, y: number): void {
    this.setParameter('ParamEyeBallX', x);
    this.setParameter('ParamEyeBallY', y);
  }

  /**
   * Enable/disable auto blinking
   */
  setAutoBlinking(enabled: boolean): void {
    // Mock auto blinking
    console.log('Auto blinking:', enabled);
  }

  /**
   * Enable/disable auto breathing
   */
  setAutoBreathing(enabled: boolean): void {
    // Mock auto breathing
    console.log('Auto breathing:', enabled);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Live2D service not initialized');
    }
  }

  private initializeDefaultParameters(): void {
    // Initialize common Live2D parameters
    const defaultParams: Live2DParameter[] = [
      {id: 'ParamAngleX', name: 'Angle X', value: 0, min: -30, max: 30, default: 0},
      {id: 'ParamAngleY', name: 'Angle Y', value: 0, min: -30, max: 30, default: 0},
      {id: 'ParamAngleZ', name: 'Angle Z', value: 0, min: -30, max: 30, default: 0},
      {id: 'ParamEyeBallX', name: 'Eye Ball X', value: 0, min: -1, max: 1, default: 0},
      {id: 'ParamEyeBallY', name: 'Eye Ball Y', value: 0, min: -1, max: 1, default: 0},
      {id: 'ParamEyeLOpen', name: 'Eye L Open', value: 1, min: 0, max: 1, default: 1},
      {id: 'ParamEyeROpen', name: 'Eye R Open', value: 1, min: 0, max: 1, default: 1},
      {id: 'ParamMouthOpenY', name: 'Mouth Open Y', value: 0, min: 0, max: 1, default: 0},
      {id: 'ParamMouthForm', name: 'Mouth Form', value: 0, min: -1, max: 1, default: 0},
      {id: 'ParamBreath', name: 'Breath', value: 0, min: 0, max: 1, default: 0},
    ];

    this.parameters.clear();
    defaultParams.forEach(param => {
      this.parameters.set(param.id, param);
    });
  }

  private updateAutoParameters(deltaTime: number): void {
    // Mock automatic parameter updates
    const time = Date.now() / 1000;
    
    // Auto breathing
    const breathValue = Math.sin(time * 0.5) * 0.5 + 0.5;
    this.setParameter('ParamBreath', breathValue);

    // Auto blinking
    if (Math.random() < 0.01) { // 1% chance per frame
      const blinkDuration = 200; // ms
      this.setParameter('ParamEyeLOpen', 0);
      this.setParameter('ParamEyeROpen', 0);
      
      setTimeout(() => {
        this.setParameter('ParamEyeLOpen', 1);
        this.setParameter('ParamEyeROpen', 1);
      }, blinkDuration);
    }
  }

  private emitEvent(type: Live2DEvent['type'], data?: any): void {
    const event: Live2DEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in Live2D event callback:', error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const live2dService = new Live2DService();