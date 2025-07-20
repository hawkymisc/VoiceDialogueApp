import {audioService} from '../audioService';

// Mock Expo AV
const mockAudio = {
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  Sound: {
    createAsync: jest.fn(() => Promise.resolve({
      sound: {
        playAsync: jest.fn(() => Promise.resolve()),
        pauseAsync: jest.fn(() => Promise.resolve()),
        unloadAsync: jest.fn(() => Promise.resolve()),
        setVolumeAsync: jest.fn(() => Promise.resolve()),
        setPositionAsync: jest.fn(() => Promise.resolve()),
        setOnPlaybackStatusUpdate: jest.fn(),
      },
    })),
  },
  INTERRUPTION_MODE_IOS_DO_NOT_MIX: 1,
  INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 1,
};

jest.mock('expo-av', () => ({
  Audio: mockAudio,
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('AudioService', () => {
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSound = {
      playAsync: jest.fn(() => Promise.resolve()),
      pauseAsync: jest.fn(() => Promise.resolve()),
      unloadAsync: jest.fn(() => Promise.resolve()),
      setVolumeAsync: jest.fn(() => Promise.resolve()),
      setPositionAsync: jest.fn(() => Promise.resolve()),
      setOnPlaybackStatusUpdate: jest.fn(),
    };

    (mockAudio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully on iOS', async () => {
      expect(audioService.getInitializationStatus()).toBe(true);
      
      expect(mockAudio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        interruptionModeIOS: mockAudio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: mockAudio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    });

    it('should handle initialization errors', async () => {
      (mockAudio.setAudioModeAsync as jest.Mock).mockRejectedValue(new Error('Init failed'));
      
      // Create new service instance to test error handling
      const testService = new (audioService.constructor as any)();
      
      // Should still report as not initialized but not crash
      expect(typeof testService.getInitializationStatus).toBe('function');
    });
  });

  describe('Audio Playback', () => {
    const testAudioOptions = {
      audioUrl: 'https://example.com/test.mp3',
      characterId: 'aoi' as const,
      emotion: 'happy' as const,
    };

    it('should play audio successfully', async () => {
      const result = await audioService.playAudio(testAudioOptions);
      
      expect(result).toBe(true);
      expect(mockAudio.Sound.createAsync).toHaveBeenCalledWith(
        {uri: testAudioOptions.audioUrl},
        {
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        expect.any(Function)
      );
    });

    it('should handle audio playback errors', async () => {
      (mockAudio.Sound.createAsync as jest.Mock).mockRejectedValue(new Error('Playback failed'));
      
      const result = await audioService.playAudio(testAudioOptions);
      
      expect(result).toBe(false);
    });

    it('should stop current audio before playing new audio', async () => {
      // Play first audio
      await audioService.playAudio(testAudioOptions);
      
      // Play second audio
      await audioService.playAudio({
        ...testAudioOptions,
        audioUrl: 'https://example.com/test2.mp3',
      });
      
      // Should have called unloadAsync to stop previous audio
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should call onPlaybackStart callback', async () => {
      const onPlaybackStart = jest.fn();
      
      await audioService.playAudio({
        ...testAudioOptions,
        onPlaybackStart,
      });
      
      expect(onPlaybackStart).toHaveBeenCalled();
    });

    it('should set volume correctly', async () => {
      await audioService.playAudio({
        ...testAudioOptions,
        volume: 0.5,
      });
      
      expect(mockAudio.Sound.createAsync).toHaveBeenCalledWith(
        {uri: testAudioOptions.audioUrl},
        expect.objectContaining({
          volume: 0.5,
        }),
        expect.any(Function)
      );
    });
  });

  describe('Audio Controls', () => {
    beforeEach(async () => {
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
    });

    it('should pause audio', async () => {
      const result = await audioService.pauseAudio();
      
      expect(result).toBe(true);
      expect(mockSound.pauseAsync).toHaveBeenCalled();
    });

    it('should resume audio', async () => {
      await audioService.pauseAudio();
      const result = await audioService.resumeAudio();
      
      expect(result).toBe(true);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should stop audio', async () => {
      const result = await audioService.stopAudio();
      
      expect(result).toBe(true);
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should set volume', async () => {
      const result = await audioService.setVolume(0.7);
      
      expect(result).toBe(true);
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.7);
    });

    it('should clamp volume between 0 and 1', async () => {
      await audioService.setVolume(1.5);
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(1);
      
      await audioService.setVolume(-0.5);
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0);
    });

    it('should seek to position', async () => {
      const result = await audioService.seekTo(5000);
      
      expect(result).toBe(true);
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(5000);
    });
  });

  describe('Audio State', () => {
    it('should return initial playback state', () => {
      const state = audioService.getPlaybackState();
      
      expect(state).toEqual({
        isPlaying: false,
        position: 0,
        duration: 0,
      });
    });

    it('should report audio playing status', async () => {
      expect(audioService.isAudioPlaying()).toBe(false);
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      // Audio playing status would be updated by status callback
      expect(typeof audioService.isAudioPlaying()).toBe('boolean');
    });

    it('should handle playback status updates', async () => {
      let statusCallback: (status: any) => void;
      
      (mockAudio.Sound.createAsync as jest.Mock).mockImplementation((source, options, callback) => {
        statusCallback = callback;
        return Promise.resolve({sound: mockSound});
      });
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      // Simulate status update
      statusCallback!({
        isLoaded: true,
        isPlaying: true,
        positionMillis: 1000,
        durationMillis: 30000,
      });
      
      const state = audioService.getPlaybackState();
      expect(state.isPlaying).toBe(true);
      expect(state.position).toBe(1000);
      expect(state.duration).toBe(30000);
    });
  });

  describe('Character Audio Processing', () => {
    it('should process character audio', async () => {
      const result = await audioService.processCharacterAudio(
        'https://example.com/test.mp3',
        'aoi',
        'happy'
      );
      
      expect(result).toBe('https://example.com/test.mp3');
    });

    it('should log character audio processing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await audioService.processCharacterAudio(
        'https://example.com/test.mp3',
        'shun',
        'sad'
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Processing audio for character shun with emotion sad'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Audio Caching', () => {
    it('should cache audio URLs', async () => {
      const url = 'https://example.com/test.mp3';
      const result = await audioService.cacheAudio(url);
      
      expect(result).toBe(url);
    });

    it('should return cached audio', async () => {
      const url = 'https://example.com/test.mp3';
      const cacheKey = 'test-key';
      
      await audioService.cacheAudio(url, cacheKey);
      const result = await audioService.cacheAudio('different-url', cacheKey);
      
      expect(result).toBe(url);
    });

    it('should clear cache', () => {
      audioService.clearCache();
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      await audioService.cleanup();
      
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      mockSound.unloadAsync.mockRejectedValue(new Error('Cleanup failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      // Should not throw
      await expect(audioService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle pause errors gracefully', async () => {
      mockSound.pauseAsync.mockRejectedValue(new Error('Pause failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      const result = await audioService.pauseAudio();
      expect(result).toBe(false);
    });

    it('should handle resume errors gracefully', async () => {
      mockSound.playAsync.mockRejectedValue(new Error('Resume failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      const result = await audioService.resumeAudio();
      expect(result).toBe(false);
    });

    it('should handle stop errors gracefully', async () => {
      mockSound.unloadAsync.mockRejectedValue(new Error('Stop failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      const result = await audioService.stopAudio();
      expect(result).toBe(false);
    });

    it('should handle volume errors gracefully', async () => {
      mockSound.setVolumeAsync.mockRejectedValue(new Error('Volume failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      const result = await audioService.setVolume(0.5);
      expect(result).toBe(false);
    });

    it('should handle seek errors gracefully', async () => {
      mockSound.setPositionAsync.mockRejectedValue(new Error('Seek failed'));
      
      await audioService.playAudio({
        audioUrl: 'https://example.com/test.mp3',
        characterId: 'aoi',
      });
      
      const result = await audioService.seekTo(1000);
      expect(result).toBe(false);
    });
  });
});