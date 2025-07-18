import audioReducer, {
  startPlayback,
  stopPlayback,
  pausePlayback,
  resumePlayback,
  setVolume,
  setSpeed,
  setCurrentTime,
  setDuration,
  setAudioLoading,
  setAudioError,
  clearAudioError,
  selectAudioState,
  selectPlaybackState,
  selectVolume,
  selectSpeed,
  selectCurrentTime,
  selectDuration,
} from '../audioSlice';
import {AudioState, PlaybackState} from '../../../types/Audio';

describe('audioSlice', () => {
  const initialState: AudioState = {
    playbackState: 'stopped',
    volume: 80,
    speed: 1.0,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(audioReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('startPlayback', () => {
    it('should start playback', () => {
      const actual = audioReducer(initialState, startPlayback());

      expect(actual.playbackState).toBe('playing');
      expect(actual.error).toBeNull();
    });

    it('should start playback from paused state', () => {
      const pausedState = {
        ...initialState,
        playbackState: 'paused' as PlaybackState,
      };

      const actual = audioReducer(pausedState, startPlayback());

      expect(actual.playbackState).toBe('playing');
    });
  });

  describe('stopPlayback', () => {
    it('should stop playback', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(playingState, stopPlayback());

      expect(actual.playbackState).toBe('stopped');
      expect(actual.currentTime).toBe(0);
    });

    it('should stop playback from paused state', () => {
      const pausedState = {
        ...initialState,
        playbackState: 'paused' as PlaybackState,
        currentTime: 45,
      };

      const actual = audioReducer(pausedState, stopPlayback());

      expect(actual.playbackState).toBe('stopped');
      expect(actual.currentTime).toBe(0);
    });
  });

  describe('pausePlayback', () => {
    it('should pause playback', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(playingState, pausePlayback());

      expect(actual.playbackState).toBe('paused');
      expect(actual.currentTime).toBe(30); // Should preserve current time
    });

    it('should not change state if already paused', () => {
      const pausedState = {
        ...initialState,
        playbackState: 'paused' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(pausedState, pausePlayback());

      expect(actual.playbackState).toBe('paused');
      expect(actual.currentTime).toBe(30);
    });
  });

  describe('resumePlayback', () => {
    it('should resume playback from paused state', () => {
      const pausedState = {
        ...initialState,
        playbackState: 'paused' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(pausedState, resumePlayback());

      expect(actual.playbackState).toBe('playing');
      expect(actual.currentTime).toBe(30); // Should preserve current time
    });

    it('should not change state if already playing', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(playingState, resumePlayback());

      expect(actual.playbackState).toBe('playing');
      expect(actual.currentTime).toBe(30);
    });
  });

  describe('setVolume', () => {
    it('should set volume', () => {
      const actual = audioReducer(initialState, setVolume(50));

      expect(actual.volume).toBe(50);
    });

    it('should clamp volume to valid range', () => {
      const highVolume = audioReducer(initialState, setVolume(150));
      expect(highVolume.volume).toBe(100);

      const lowVolume = audioReducer(initialState, setVolume(-10));
      expect(lowVolume.volume).toBe(0);
    });
  });

  describe('setSpeed', () => {
    it('should set playback speed', () => {
      const actual = audioReducer(initialState, setSpeed(1.5));

      expect(actual.speed).toBe(1.5);
    });

    it('should clamp speed to valid range', () => {
      const highSpeed = audioReducer(initialState, setSpeed(5.0));
      expect(highSpeed.speed).toBe(2.0);

      const lowSpeed = audioReducer(initialState, setSpeed(0.1));
      expect(lowSpeed.speed).toBe(0.5);
    });
  });

  describe('setCurrentTime', () => {
    it('should set current time', () => {
      const actual = audioReducer(initialState, setCurrentTime(45));

      expect(actual.currentTime).toBe(45);
    });

    it('should clamp current time to valid range', () => {
      const stateWithDuration = {
        ...initialState,
        duration: 100,
      };

      const highTime = audioReducer(stateWithDuration, setCurrentTime(150));
      expect(highTime.currentTime).toBe(100);

      const lowTime = audioReducer(stateWithDuration, setCurrentTime(-10));
      expect(lowTime.currentTime).toBe(0);
    });
  });

  describe('setDuration', () => {
    it('should set duration', () => {
      const actual = audioReducer(initialState, setDuration(120));

      expect(actual.duration).toBe(120);
    });

    it('should not allow negative duration', () => {
      const actual = audioReducer(initialState, setDuration(-30));

      expect(actual.duration).toBe(0);
    });
  });

  describe('setAudioLoading', () => {
    it('should set loading state', () => {
      const actual = audioReducer(initialState, setAudioLoading(true));

      expect(actual.isLoading).toBe(true);
    });

    it('should clear error when setting loading to true', () => {
      const stateWithError = {
        ...initialState,
        error: 'Audio loading failed',
      };

      const actual = audioReducer(stateWithError, setAudioLoading(true));

      expect(actual.isLoading).toBe(true);
      expect(actual.error).toBeNull();
    });
  });

  describe('setAudioError', () => {
    it('should set error state', () => {
      const errorMessage = 'Failed to load audio';
      const actual = audioReducer(initialState, setAudioError(errorMessage));

      expect(actual.error).toBe(errorMessage);
      expect(actual.isLoading).toBe(false);
    });

    it('should stop playback when error occurs', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
        currentTime: 30,
      };

      const actual = audioReducer(playingState, setAudioError('Playback error'));

      expect(actual.playbackState).toBe('stopped');
      expect(actual.currentTime).toBe(0);
      expect(actual.error).toBe('Playback error');
    });
  });

  describe('clearAudioError', () => {
    it('should clear error state', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };

      const actual = audioReducer(stateWithError, clearAudioError());

      expect(actual.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      audio: {
        playbackState: 'playing' as PlaybackState,
        volume: 75,
        speed: 1.2,
        currentTime: 45,
        duration: 120,
        isLoading: false,
        error: null,
      },
    };

    it('selectAudioState should return audio state', () => {
      expect(selectAudioState(mockState)).toEqual(mockState.audio);
    });

    it('selectPlaybackState should return playback state', () => {
      expect(selectPlaybackState(mockState)).toBe('playing');
    });

    it('selectVolume should return volume', () => {
      expect(selectVolume(mockState)).toBe(75);
    });

    it('selectSpeed should return speed', () => {
      expect(selectSpeed(mockState)).toBe(1.2);
    });

    it('selectCurrentTime should return current time', () => {
      expect(selectCurrentTime(mockState)).toBe(45);
    });

    it('selectDuration should return duration', () => {
      expect(selectDuration(mockState)).toBe(120);
    });
  });

  describe('playback state transitions', () => {
    it('should handle complete playback cycle', () => {
      let state = initialState;

      // Start playback
      state = audioReducer(state, startPlayback());
      expect(state.playbackState).toBe('playing');

      // Pause playback
      state = audioReducer(state, pausePlayback());
      expect(state.playbackState).toBe('paused');

      // Resume playback
      state = audioReducer(state, resumePlayback());
      expect(state.playbackState).toBe('playing');

      // Stop playback
      state = audioReducer(state, stopPlayback());
      expect(state.playbackState).toBe('stopped');
      expect(state.currentTime).toBe(0);
    });
  });

  describe('volume control', () => {
    it('should handle volume changes during playback', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
      };

      const actual = audioReducer(playingState, setVolume(90));

      expect(actual.volume).toBe(90);
      expect(actual.playbackState).toBe('playing'); // Should not affect playback
    });

    it('should handle mute and unmute', () => {
      const stateWithVolume = {
        ...initialState,
        volume: 75,
      };

      // Mute
      const muted = audioReducer(stateWithVolume, setVolume(0));
      expect(muted.volume).toBe(0);

      // Unmute
      const unmuted = audioReducer(muted, setVolume(75));
      expect(unmuted.volume).toBe(75);
    });
  });

  describe('speed control', () => {
    it('should handle speed changes during playback', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
      };

      const actual = audioReducer(playingState, setSpeed(1.5));

      expect(actual.speed).toBe(1.5);
      expect(actual.playbackState).toBe('playing'); // Should not affect playback
    });

    it('should handle various speed values', () => {
      const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      
      speeds.forEach(speed => {
        const actual = audioReducer(initialState, setSpeed(speed));
        expect(actual.speed).toBe(speed);
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      const networkError = 'Network error: Unable to load audio';
      const actual = audioReducer(initialState, setAudioError(networkError));

      expect(actual.error).toBe(networkError);
      expect(actual.isLoading).toBe(false);
    });

    it('should handle codec errors', () => {
      const codecError = 'Codec error: Unsupported audio format';
      const actual = audioReducer(initialState, setAudioError(codecError));

      expect(actual.error).toBe(codecError);
    });

    it('should handle permission errors', () => {
      const permissionError = 'Permission denied: Cannot access audio device';
      const actual = audioReducer(initialState, setAudioError(permissionError));

      expect(actual.error).toBe(permissionError);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      let state = initialState;

      // Rapid start/stop
      state = audioReducer(state, startPlayback());
      state = audioReducer(state, stopPlayback());
      state = audioReducer(state, startPlayback());

      expect(state.playbackState).toBe('playing');
      expect(state.currentTime).toBe(0);
    });

    it('should handle time updates during playback', () => {
      const playingState = {
        ...initialState,
        playbackState: 'playing' as PlaybackState,
        duration: 100,
      };

      let state = playingState;
      
      // Simulate time updates
      for (let i = 0; i <= 100; i += 10) {
        state = audioReducer(state, setCurrentTime(i));
        expect(state.currentTime).toBe(i);
      }
    });

    it('should handle zero duration audio', () => {
      const actual = audioReducer(initialState, setDuration(0));

      expect(actual.duration).toBe(0);
    });

    it('should handle long duration audio', () => {
      const longDuration = 3600; // 1 hour
      const actual = audioReducer(initialState, setDuration(longDuration));

      expect(actual.duration).toBe(longDuration);
    });
  });

  describe('loading states', () => {
    it('should handle loading start and end', () => {
      let state = initialState;

      // Start loading
      state = audioReducer(state, setAudioLoading(true));
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();

      // End loading
      state = audioReducer(state, setAudioLoading(false));
      expect(state.isLoading).toBe(false);
    });

    it('should handle loading with error', () => {
      let state = initialState;

      // Start loading
      state = audioReducer(state, setAudioLoading(true));
      expect(state.isLoading).toBe(true);

      // Error during loading
      state = audioReducer(state, setAudioError('Loading failed'));
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Loading failed');
    });
  });
});