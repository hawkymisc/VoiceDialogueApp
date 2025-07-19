import {EmotionState} from './Dialogue';

export interface Live2DModelConfig {
  modelPath: string;
  texturePath: string;
  physicsPath?: string;
  posePath?: string;
  expressionPath?: string;
  motionPath?: string;
}

export interface Live2DModel {
  id: string;
  name: string;
  config: Live2DModelConfig;
  isLoaded: boolean;
  error?: string;
}

export interface Live2DExpression {
  id: string;
  name: string;
  file: string;
  emotion: EmotionState;
  intensity: number; // 0.0 to 1.0
}

export interface Live2DMotion {
  id: string;
  name: string;
  file: string;
  group: string;
  priority: number;
  loop: boolean;
  duration: number; // in milliseconds
  fadeIn: number; // in milliseconds
  fadeOut: number; // in milliseconds
}

export interface Live2DParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  default: number;
}

export interface Live2DAnimation {
  expression?: Live2DExpression;
  motion?: Live2DMotion;
  parameters?: Live2DParameter[];
  duration: number;
  autoPlay: boolean;
  loop: boolean;
}

export interface Live2DViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface Live2DRenderConfig {
  viewport: Live2DViewport;
  backgroundColor: string;
  antialias: boolean;
  fps: number;
  quality: 'low' | 'medium' | 'high';
}

export interface Live2DState {
  currentModel: Live2DModel | null;
  availableModels: Live2DModel[];
  currentExpression: Live2DExpression | null;
  currentMotion: Live2DMotion | null;
  isPlaying: boolean;
  isLoading: boolean;
  renderConfig: Live2DRenderConfig;
  parameters: Live2DParameter[];
  error: string | null;
}

export interface Live2DModelAssets {
  model: {
    aoi: Live2DModelConfig;
    shun: Live2DModelConfig;
  };
  expressions: {
    [key: string]: Live2DExpression[];
  };
  motions: {
    [key: string]: Live2DMotion[];
  };
}

export interface Live2DEvent {
  type: 'modelLoaded' | 'expressionChanged' | 'motionStarted' | 'motionEnded' | 'parameterChanged' | 'error';
  data?: any;
  timestamp: number;
}

export interface Live2DLipSync {
  enabled: boolean;
  audioData: ArrayBuffer | null;
  sensitivity: number;
  smoothing: number;
  parameterIds: string[];
}

export interface Live2DPhysics {
  enabled: boolean;
  gravity: number;
  wind: number;
  damping: number;
}

export interface Live2DInteraction {
  touchEnabled: boolean;
  eyeTrackingEnabled: boolean;
  autoBlinking: boolean;
  autoBreathing: boolean;
  touchAreas: Live2DTouchArea[];
}

export interface Live2DTouchArea {
  id: string;
  name: string;
  hitArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  motionGroup?: string;
  expression?: string;
  callback?: (area: Live2DTouchArea) => void;
}

export interface Live2DCharacterConfig {
  characterId: string;
  modelConfig: Live2DModelConfig;
  expressions: Live2DExpression[];
  motions: Live2DMotion[];
  parameters: Live2DParameter[];
  lipSync: Live2DLipSync;
  physics: Live2DPhysics;
  interaction: Live2DInteraction;
}

export type Live2DEventCallback = (event: Live2DEvent) => void;

export interface Live2DManager {
  initialize(): Promise<void>;
  loadModel(config: Live2DModelConfig): Promise<Live2DModel>;
  setExpression(expression: Live2DExpression): Promise<void>;
  playMotion(motion: Live2DMotion): Promise<void>;
  setParameter(parameterId: string, value: number): void;
  update(deltaTime: number): void;
  render(): void;
  addEventListener(callback: Live2DEventCallback): void;
  removeEventListener(callback: Live2DEventCallback): void;
  dispose(): void;
}

export default Live2DState;