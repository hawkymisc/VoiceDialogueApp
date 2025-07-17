// Audio and TTS-related type definitions

import {EmotionType} from './Dialogue';

export interface VoiceSynthesisRequest {
  text: string;
  characterId: string;
  emotion: EmotionType;
  speed: number; // 0.5-2.0
  pitch: number; // 0-100
  volume: number; // 0-100
}

export interface VoiceSynthesisResponse {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  duration: number; // in seconds
  metadata: {
    characterId: string;
    emotion: EmotionType;
    generatedAt: Date;
    quality: 'standard' | 'high' | 'premium';
  };
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentAudioUrl: string | null;
  volume: number; // 0-100
  speed: number; // 0.5-2.0
  currentTime: number; // in seconds
  duration: number; // in seconds
  isLoading: boolean;
  error: string | null;
}

export interface AudioCache {
  [key: string]: {
    audioUrl: string;
    expiresAt: Date;
    size: number; // in bytes
  };
}

export interface TTSConfig {
  provider: 'azure' | 'elevenlabs' | 'voicevox';
  apiKey?: string;
  endpoint?: string;
  defaultSettings: {
    rate: string;
    pitch: string;
    volume: string;
  };
}

// Azure TTS specific types
export interface AzureTTSConfig {
  voice: string; // ja-JP-KeitaNeural, ja-JP-DaichiNeural
  rate: string; // x-slow, slow, medium, fast, x-fast
  pitch: string; // x-low, low, medium, high, x-high
  volume: string; // silent, x-soft, soft, medium, loud, x-loud
  emotion: string; // calm, cheerful, sad, angry, fearful
}

// ElevenLabs specific types
export interface ElevenLabsConfig {
  voiceId: string;
  stability: number; // 0-1
  similarityBoost: number; // 0-1
  style: number; // 0-1
  useSpeakerBoost: boolean;
}

// VOICEVOX specific types
export interface VOICEVOXConfig {
  speaker: number; // speaker ID
  speedScale: number; // 0.5-2.0
  pitchScale: number; // -0.15-0.15
  intonationScale: number; // 0-2.0
  volumeScale: number; // 0-2.0
}

export interface LipSyncData {
  phonemes: Array<{
    phoneme: string;
    startTime: number;
    endTime: number;
    intensity: number;
  }>;
  duration: number;
}

export interface AudioState {
  player: AudioPlayerState;
  cache: AudioCache;
  ttsConfig: TTSConfig;
  isInitialized: boolean;
  supportedFormats: string[];
}
