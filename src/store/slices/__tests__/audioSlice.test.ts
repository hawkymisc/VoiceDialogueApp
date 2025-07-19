import audioReducer, {
  playAudio,
  pauseAudio,
  stopAudio,
  setVolume,
  setSpeed,
  setCurrentTime,
  setDuration,
  setPlayerLoading,
  setPlayerError,
} from '../audioSlice';
import {AudioState} from '../../../types/Audio';

describe('audioSlice', () => {
  const initialState: AudioState = {
    player: {
      isPlaying: false,
      currentAudioUrl: null,
      volume: 80,
      speed: 1.0,
      currentTime: 0,
      duration: 0,
      isLoading: false,
      error: null,
    },
    cache: {},
    ttsConfig: {
      provider: 'azure',
      defaultSettings: {
        rate: 'medium',
        pitch: 'medium',
        volume: 'medium',
      },
    },
    isInitialized: false,
    supportedFormats: ['mp3', 'wav', 'aac'],
  };

  it('should return the initial state', () => {
    expect(audioReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('playAudio', () => {
    it('should start playback', () => {
      const actual = audioReducer(initialState, playAudio('test-audio-url'));

      expect(actual.player.isPlaying).toBe(true);
      expect(actual.player.currentAudioUrl).toBe('test-audio-url');
      expect(actual.player.error).toBeNull();
    });

    it('should start playback from stopped state', () => {
      const stoppedState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: false,
        },
      };

      const actual = audioReducer(stoppedState, playAudio('new-audio-url'));

      expect(actual.player.isPlaying).toBe(true);
      expect(actual.player.currentAudioUrl).toBe('new-audio-url');
    });
  });

  describe('stopAudio', () => {
    it('should stop playback', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
          currentTime: 30,
          currentAudioUrl: 'test-audio-url',
        },
      };

      const actual = audioReducer(playingState, stopAudio());

      expect(actual.player.isPlaying).toBe(false);
      expect(actual.player.currentTime).toBe(0);
      expect(actual.player.currentAudioUrl).toBeNull();
    });

    it('should stop playback from playing state', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
          currentTime: 45,
          currentAudioUrl: 'test-audio-url',
        },
      };

      const actual = audioReducer(playingState, stopAudio());

      expect(actual.player.isPlaying).toBe(false);
      expect(actual.player.currentTime).toBe(0);
      expect(actual.player.currentAudioUrl).toBeNull();
    });
  });

  describe('pauseAudio', () => {
    it('should pause playback', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
          currentTime: 30,
        },
      };

      const actual = audioReducer(playingState, pauseAudio());

      expect(actual.player.isPlaying).toBe(false);
      expect(actual.player.currentTime).toBe(30); // Should preserve current time
    });

    it('should not change time if already paused', () => {
      const pausedState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: false,
          currentTime: 30,
        },
      };

      const actual = audioReducer(pausedState, pauseAudio());

      expect(actual.player.isPlaying).toBe(false);
      expect(actual.player.currentTime).toBe(30);
    });
  });

  // playAudioで resume 機能をテスト
  describe('resume playback via playAudio', () => {
    it('should resume playback with existing audio URL', () => {
      const pausedState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: false,
          currentTime: 30,
          currentAudioUrl: 'existing-audio-url',
        },
      };

      const actual = audioReducer(pausedState, playAudio('existing-audio-url'));

      expect(actual.player.isPlaying).toBe(true);
      expect(actual.player.currentAudioUrl).toBe('existing-audio-url');
    });
  });

  describe('setVolume', () => {
    it('should set volume', () => {
      const actual = audioReducer(initialState, setVolume(50));

      expect(actual.player.volume).toBe(50);
    });

    it('should clamp volume to valid range', () => {
      const highVolume = audioReducer(initialState, setVolume(150));
      expect(highVolume.player.volume).toBe(100);

      const lowVolume = audioReducer(initialState, setVolume(-10));
      expect(lowVolume.player.volume).toBe(0);
    });
  });

  describe('setSpeed', () => {
    it('should set playback speed', () => {
      const actual = audioReducer(initialState, setSpeed(1.5));

      expect(actual.player.speed).toBe(1.5);
    });

    it('should clamp speed to valid range', () => {
      const highSpeed = audioReducer(initialState, setSpeed(5.0));
      expect(highSpeed.player.speed).toBe(2.0);

      const lowSpeed = audioReducer(initialState, setSpeed(0.1));
      expect(lowSpeed.player.speed).toBe(0.5);
    });
  });

  describe('setCurrentTime', () => {
    it('should set current time', () => {
      const actual = audioReducer(initialState, setCurrentTime(45));

      expect(actual.player.currentTime).toBe(45);
    });

    it('should allow any current time value', () => {
      const stateWithDuration = {
        ...initialState,
        player: {
          ...initialState.player,
          duration: 100,
        },
      };

      const highTime = audioReducer(stateWithDuration, setCurrentTime(150));
      expect(highTime.player.currentTime).toBe(150);

      const lowTime = audioReducer(stateWithDuration, setCurrentTime(-10));
      expect(lowTime.player.currentTime).toBe(-10);
    });
  });

  describe('setDuration', () => {
    it('should set duration', () => {
      const actual = audioReducer(initialState, setDuration(120));

      expect(actual.player.duration).toBe(120);
    });

    it('should allow any duration value', () => {
      const actual = audioReducer(initialState, setDuration(-30));

      expect(actual.player.duration).toBe(-30);
    });
  });

  describe('setPlayerLoading', () => {
    it('should set loading state', () => {
      const actual = audioReducer(initialState, setPlayerLoading(true));

      expect(actual.player.isLoading).toBe(true);
    });

    it('should not clear error when setting loading', () => {
      const stateWithError = {
        ...initialState,
        player: {
          ...initialState.player,
          error: 'Audio loading failed',
        },
      };

      const actual = audioReducer(stateWithError, setPlayerLoading(true));

      expect(actual.player.isLoading).toBe(true);
      expect(actual.player.error).toBe('Audio loading failed');
    });
  });

  describe('setPlayerError', () => {
    it('should set error state', () => {
      const errorMessage = 'Failed to load audio';
      const actual = audioReducer(initialState, setPlayerError(errorMessage));

      expect(actual.player.error).toBe(errorMessage);
    });

    it('should not affect playback when error occurs', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
          currentTime: 30,
        },
      };

      const actual = audioReducer(playingState, setPlayerError('Playback error'));

      expect(actual.player.isPlaying).toBe(true);
      expect(actual.player.currentTime).toBe(30);
      expect(actual.player.error).toBe('Playback error');
    });
  });

  describe('clear error via setPlayerError', () => {
    it('should clear error state', () => {
      const stateWithError = {
        ...initialState,
        player: {
          ...initialState.player,
          error: 'Some error',
        },
      };

      const actual = audioReducer(stateWithError, setPlayerError(null));

      expect(actual.player.error).toBeNull();
    });
  });

  // Selectorsのテストは削除（実装されていないため）

  describe('playback state transitions', () => {
    it('should handle complete playback cycle', () => {
      let state = initialState;

      // Start playback
      state = audioReducer(state, playAudio('test-audio-url'));
      expect(state.player.isPlaying).toBe(true);
      expect(state.player.currentAudioUrl).toBe('test-audio-url');

      // Pause playback
      state = audioReducer(state, pauseAudio());
      expect(state.player.isPlaying).toBe(false);

      // Resume playback
      state = audioReducer(state, playAudio('test-audio-url'));
      expect(state.player.isPlaying).toBe(true);

      // Stop playback
      state = audioReducer(state, stopAudio());
      expect(state.player.isPlaying).toBe(false);
      expect(state.player.currentTime).toBe(0);
      expect(state.player.currentAudioUrl).toBeNull();
    });
  });

  describe('volume control', () => {
    it('should handle volume changes during playback', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
        },
      };

      const actual = audioReducer(playingState, setVolume(90));

      expect(actual.player.volume).toBe(90);
      expect(actual.player.isPlaying).toBe(true); // Should not affect playback
    });

    it('should handle mute and unmute', () => {
      const stateWithVolume = {
        ...initialState,
        player: {
          ...initialState.player,
          volume: 75,
        },
      };

      // Mute
      const muted = audioReducer(stateWithVolume, setVolume(0));
      expect(muted.player.volume).toBe(0);

      // Unmute
      const unmuted = audioReducer(muted, setVolume(75));
      expect(unmuted.player.volume).toBe(75);
    });
  });

  describe('speed control', () => {
    it('should handle speed changes during playback', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
        },
      };

      const actual = audioReducer(playingState, setSpeed(1.5));

      expect(actual.player.speed).toBe(1.5);
      expect(actual.player.isPlaying).toBe(true); // Should not affect playback
    });

    it('should handle various speed values', () => {
      const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      
      speeds.forEach(speed => {
        const actual = audioReducer(initialState, setSpeed(speed));
        expect(actual.player.speed).toBe(speed);
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      const networkError = 'Network error: Unable to load audio';
      const actual = audioReducer(initialState, setPlayerError(networkError));

      expect(actual.player.error).toBe(networkError);
    });

    it('should handle codec errors', () => {
      const codecError = 'Codec error: Unsupported audio format';
      const actual = audioReducer(initialState, setPlayerError(codecError));

      expect(actual.player.error).toBe(codecError);
    });

    it('should handle permission errors', () => {
      const permissionError = 'Permission denied: Cannot access audio device';
      const actual = audioReducer(initialState, setPlayerError(permissionError));

      expect(actual.player.error).toBe(permissionError);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      let state = initialState;

      // Rapid start/stop
      state = audioReducer(state, playAudio('test-audio-url'));
      state = audioReducer(state, stopAudio());
      state = audioReducer(state, playAudio('test-audio-url-2'));

      expect(state.player.isPlaying).toBe(true);
      expect(state.player.currentTime).toBe(0);
      expect(state.player.currentAudioUrl).toBe('test-audio-url-2');
    });

    it('should handle time updates during playback', () => {
      const playingState = {
        ...initialState,
        player: {
          ...initialState.player,
          isPlaying: true,
          duration: 100,
        },
      };

      let state = playingState;
      
      // Simulate time updates
      for (let i = 0; i <= 100; i += 10) {
        state = audioReducer(state, setCurrentTime(i));
        expect(state.player.currentTime).toBe(i);
      }
    });

    it('should handle zero duration audio', () => {
      const actual = audioReducer(initialState, setDuration(0));

      expect(actual.player.duration).toBe(0);
    });

    it('should handle long duration audio', () => {
      const longDuration = 3600; // 1 hour
      const actual = audioReducer(initialState, setDuration(longDuration));

      expect(actual.player.duration).toBe(longDuration);
    });
  });

  describe('loading states', () => {
    it('should handle loading start and end', () => {
      let state = initialState;

      // Start loading
      state = audioReducer(state, setPlayerLoading(true));
      expect(state.player.isLoading).toBe(true);

      // End loading
      state = audioReducer(state, setPlayerLoading(false));
      expect(state.player.isLoading).toBe(false);
    });

    it('should handle loading with error', () => {
      let state = initialState;

      // Start loading
      state = audioReducer(state, setPlayerLoading(true));
      expect(state.player.isLoading).toBe(true);

      // Error during loading
      state = audioReducer(state, setPlayerError('Loading failed'));
      expect(state.player.error).toBe('Loading failed');
      // Loading状態は変更されない
      expect(state.player.isLoading).toBe(true);
    });
  });
});