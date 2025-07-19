import Sound from 'react-native-sound';
import {EmotionState} from '../types/Dialogue';
import {CharacterType} from '../types/Character';

export interface AudioPlayerConfig {
  volume: number; // 0.0 to 1.0
  speed: number; // 0.5 to 2.0
  enableDucking: boolean;
  enableBackground: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  error?: string;
}

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
  progress: number; // 0.0 to 1.0
}

export interface AudioTrack {
  id: string;
  audioUrl: string;
  audioData?: string;
  text: string;
  characterId: CharacterType;
  emotion: EmotionState;
  duration: number;
}

class AudioPlayerService {
  private currentSound: Sound | null = null;
  private currentTrack: AudioTrack | null = null;
  private playbackState: PlaybackState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
  };
  private config: AudioPlayerConfig = {
    volume: 1.0,
    speed: 1.0,
    enableDucking: true,
    enableBackground: false,
  };
  private progressInterval: NodeJS.Timeout | null = null;
  private progressCallbacks: Array<(progress: PlaybackProgress) => void> = [];
  private stateChangeCallbacks: Array<(state: PlaybackState) => void> = [];

  constructor() {
    this.initializeAudioSession();
  }

  private initializeAudioSession() {
    // Enable playback in silence mode
    Sound.setCategory('Playback');
    Sound.setMode('Default');
    Sound.setActive(true);
  }

  /**
   * Load and play audio track
   */
  async playAudio(track: AudioTrack): Promise<void> {
    try {
      this.updatePlaybackState({ isLoading: true, error: undefined });
      
      // Stop current audio if playing
      if (this.currentSound) {
        await this.stopAudio();
      }

      this.currentTrack = track;

      // Create Sound instance
      const sound = new Sound(track.audioUrl, undefined, (error) => {
        if (error) {
          console.error('Failed to load audio:', error);
          this.updatePlaybackState({ 
            isLoading: false, 
            error: 'Failed to load audio' 
          });
          return;
        }

        // Set audio properties
        sound.setVolume(this.config.volume);
        sound.setSpeed(this.config.speed);
        
        const duration = sound.getDuration();
        this.updatePlaybackState({
          isLoading: false,
          duration: duration * 1000, // Convert to milliseconds
        });

        // Play the audio
        sound.play((success) => {
          if (success) {
            console.log('Audio playback completed');
            this.handlePlaybackComplete();
          } else {
            console.error('Audio playback failed');
            this.updatePlaybackState({ 
              isPlaying: false, 
              error: 'Playback failed' 
            });
          }
        });

        this.currentSound = sound;
        this.updatePlaybackState({ isPlaying: true });
        this.startProgressTracking();
      });

    } catch (error) {
      console.error('Failed to play audio:', error);
      this.updatePlaybackState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Pause audio playback
   */
  async pauseAudio(): Promise<void> {
    if (this.currentSound && this.playbackState.isPlaying) {
      this.currentSound.pause();
      this.updatePlaybackState({ isPlaying: false, isPaused: true });
      this.stopProgressTracking();
    }
  }

  /**
   * Resume audio playback
   */
  async resumeAudio(): Promise<void> {
    if (this.currentSound && this.playbackState.isPaused) {
      this.currentSound.play((success) => {
        if (success) {
          console.log('Audio resume completed');
          this.handlePlaybackComplete();
        } else {
          console.error('Audio resume failed');
          this.updatePlaybackState({ 
            isPlaying: false, 
            error: 'Resume failed' 
          });
        }
      });
      
      this.updatePlaybackState({ isPlaying: true, isPaused: false });
      this.startProgressTracking();
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio(): Promise<void> {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.release();
      this.currentSound = null;
    }
    
    this.currentTrack = null;
    this.stopProgressTracking();
    this.updatePlaybackState({
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      duration: 0,
      currentTime: 0,
      error: undefined,
    });
  }

  /**
   * Seek to specific position
   */
  async seekTo(positionMs: number): Promise<void> {
    if (this.currentSound && this.playbackState.duration > 0) {
      const positionSeconds = positionMs / 1000;
      this.currentSound.setCurrentTime(positionSeconds);
      this.updatePlaybackState({ currentTime: positionMs });
    }
  }

  /**
   * Set playback volume
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.currentSound) {
      this.currentSound.setVolume(this.config.volume);
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
    if (this.currentSound) {
      this.currentSound.setSpeed(this.config.speed);
    }
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Get current track
   */
  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  /**
   * Get current audio configuration
   */
  getConfig(): AudioPlayerConfig {
    return { ...this.config };
  }

  /**
   * Update audio configuration
   */
  updateConfig(config: Partial<AudioPlayerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Apply changes to current sound
    if (this.currentSound) {
      if (config.volume !== undefined) {
        this.currentSound.setVolume(this.config.volume);
      }
      if (config.speed !== undefined) {
        this.currentSound.setSpeed(this.config.speed);
      }
    }
  }

  /**
   * Add progress callback
   */
  addProgressCallback(callback: (progress: PlaybackProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(callback: (progress: PlaybackProgress) => void): void {
    this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Add state change callback
   */
  addStateChangeCallback(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove state change callback
   */
  removeStateChangeCallback(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks(): void {
    this.progressCallbacks = [];
    this.stateChangeCallbacks = [];
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  /**
   * Check if audio is currently paused
   */
  isPaused(): boolean {
    return this.playbackState.isPaused;
  }

  /**
   * Check if audio is currently loading
   */
  isLoading(): boolean {
    return this.playbackState.isLoading;
  }

  /**
   * Get current progress
   */
  getProgress(): PlaybackProgress {
    return {
      currentTime: this.playbackState.currentTime,
      duration: this.playbackState.duration,
      progress: this.playbackState.duration > 0 
        ? this.playbackState.currentTime / this.playbackState.duration 
        : 0,
    };
  }

  private handlePlaybackComplete(): void {
    this.updatePlaybackState({ isPlaying: false, isPaused: false });
    this.stopProgressTracking();
  }

  private updatePlaybackState(updates: Partial<PlaybackState>): void {
    this.playbackState = { ...this.playbackState, ...updates };
    
    // Notify state change callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.getPlaybackState());
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  private startProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = setInterval(() => {
      if (this.currentSound && this.playbackState.isPlaying) {
        this.currentSound.getCurrentTime((currentTime) => {
          const currentTimeMs = currentTime * 1000;
          this.updatePlaybackState({ currentTime: currentTimeMs });

          // Notify progress callbacks
          const progress = this.getProgress();
          this.progressCallbacks.forEach(callback => {
            try {
              callback(progress);
            } catch (error) {
              console.error('Error in progress callback:', error);
            }
          });
        });
      }
    }, 100); // Update every 100ms
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAudio();
    this.clearCallbacks();
  }
}

export const audioPlayerService = new AudioPlayerService();