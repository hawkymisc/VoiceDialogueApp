import Sound from 'react-native-sound';
import {Platform} from 'react-native';
import {CharacterType, EmotionType} from '../types';

export interface AudioPlaybackOptions {
  audioUrl: string;
  characterId: CharacterType;
  emotion?: EmotionType;
  volume?: number;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onPlaybackError?: (error: Error) => void;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
}

class AudioService {
  private sound: Sound | null = null;
  private isInitialized = false;
  private currentState: AudioPlaybackState = {
    isPlaying: false,
    position: 0,
    duration: 0,
  };
  private audioCache: Map<string, string> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Enable playback in silence mode for iOS
      Sound.setCategory('Playback');
      this.isInitialized = true;
      console.log('AudioService initialized successfully');
    } catch (error) {
      console.warn('AudioService initialization failed:', error);
      this.isInitialized = true; // Continue without audio session config
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  async playAudio(options: AudioPlaybackOptions): Promise<boolean> {
    try {
      // Stop current audio if playing
      if (this.sound) {
        this.sound.stop();
        this.sound.release();
        this.sound = null;
      }

      const {audioUrl, volume = 1.0, onPlaybackStart, onPlaybackEnd, onPlaybackError} = options;

      return new Promise<boolean>((resolve) => {
        this.sound = new Sound(audioUrl, '', (error) => {
          if (error) {
            console.error('Failed to load audio:', error);
            onPlaybackError?.(error);
            resolve(false);
            return;
          }

          if (this.sound) {
            this.sound.setVolume(volume);
            
            this.sound.play((success) => {
              if (success) {
                console.log('Audio playback completed');
                this.currentState.isPlaying = false;
                onPlaybackEnd?.();
              } else {
                console.error('Audio playback failed');
                onPlaybackError?.(new Error('Playback failed'));
              }
            });

            this.currentState.isPlaying = true;
            this.currentState.duration = this.sound.getDuration();
            onPlaybackStart?.();
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      return false;
    }
  }

  async pauseAudio(): Promise<boolean> {
    try {
      if (this.sound && this.currentState.isPlaying) {
        this.sound.pause();
        this.currentState.isPlaying = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Audio pause error:', error);
      return false;
    }
  }

  async resumeAudio(): Promise<boolean> {
    try {
      if (this.sound && !this.currentState.isPlaying) {
        this.sound.play();
        this.currentState.isPlaying = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Audio resume error:', error);
      return false;
    }
  }

  async stopAudio(): Promise<boolean> {
    try {
      if (this.sound) {
        this.sound.stop();
        this.currentState.isPlaying = false;
        this.currentState.position = 0;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Audio stop error:', error);
      return false;
    }
  }

  async setVolume(volume: number): Promise<boolean> {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      if (this.sound) {
        this.sound.setVolume(clampedVolume);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Audio volume error:', error);
      return false;
    }
  }

  async seekTo(position: number): Promise<boolean> {
    try {
      if (this.sound) {
        this.sound.setCurrentTime(position / 1000); // Convert to seconds
        this.currentState.position = position;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Audio seek error:', error);
      return false;
    }
  }

  getPlaybackState(): AudioPlaybackState {
    return {...this.currentState};
  }

  isAudioPlaying(): boolean {
    return this.currentState.isPlaying;
  }

  async processCharacterAudio(
    audioUrl: string,
    characterId: CharacterType,
    emotion?: EmotionType
  ): Promise<string> {
    console.log(`Processing audio for character ${characterId} with emotion ${emotion}`);
    // Basic implementation - return URL as-is
    return audioUrl;
  }

  async cacheAudio(audioUrl: string, cacheKey?: string): Promise<string> {
    const key = cacheKey || audioUrl;
    
    // Check if already cached
    if (this.audioCache.has(key)) {
      return this.audioCache.get(key)!;
    }
    
    // For now, just cache the URL
    this.audioCache.set(key, audioUrl);
    return audioUrl;
  }

  clearCache(): void {
    this.audioCache.clear();
  }

  async cleanup(): Promise<void> {
    try {
      if (this.sound) {
        this.sound.stop();
        this.sound.release();
        this.sound = null;
      }
      this.currentState = {
        isPlaying: false,
        position: 0,
        duration: 0,
      };
    } catch (error) {
      console.error('Audio cleanup error:', error);
    }
  }
}

export const audioService = new AudioService();