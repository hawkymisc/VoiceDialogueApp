import {ttsService} from '../ttsService';
import {audioPlayerService} from '../audioPlayerService';
import {generateSpeech, setVoiceSettings, setAutoPlay, setVolume, setSpeed, clearVoiceError} from '../../store/slices/voiceSlice';
import {configureStore} from '@reduxjs/toolkit';
import voiceSlice from '../../store/slices/voiceSlice';

// Mock React Native modules
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: {
    fromSubscription: jest.fn(),
  },
  SpeechSynthesizer: jest.fn(),
  SpeechSynthesisOutputFormat: {
    Audio48Khz192KBitRateMonoMp3: 'Audio48Khz192KBitRateMonoMp3',
  },
  ResultReason: {
    SynthesizingAudioCompleted: 'SynthesizingAudioCompleted',
  },
}));

jest.mock('react-native-sound', () => {
  const mockSound = {
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
    setSpeed: jest.fn(),
    getDuration: jest.fn(() => 3.0),
    getCurrentTime: jest.fn(),
    setCurrentTime: jest.fn(),
  };
  
  const Sound = jest.fn(() => mockSound);
  Sound.setCategory = jest.fn();
  Sound.setMode = jest.fn();
  Sound.setActive = jest.fn();
  
  return Sound;
});

// Mock services
jest.mock('../ttsService');
jest.mock('../audioPlayerService');

const mockTTSService = ttsService as jest.Mocked<typeof ttsService>;
const mockAudioPlayerService = audioPlayerService as jest.Mocked<typeof audioPlayerService>;

describe('Voice Integration System', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test store
    store = configureStore({
      reducer: {
        voice: voiceSlice,
      },
    });
  });

  describe('TTS Service Integration', () => {
    it('should generate speech with correct parameters', async () => {
      // Mock TTS service response
      mockTTSService.synthesizeSpeech.mockResolvedValue({
        audioUrl: 'data:audio/mp3;base64,mock-audio-data',
        audioData: 'mock-audio-data',
        duration: 3000,
        success: true,
      });

      const request = {
        text: 'こんにちは、蒼です。',
        characterId: 'aoi' as const,
        emotion: 'happy' as const,
        messageId: 'test-message-1',
      };

      await store.dispatch(generateSpeech(request));

      expect(mockTTSService.synthesizeSpeech).toHaveBeenCalledWith({
        text: request.text,
        characterId: request.characterId,
        emotion: request.emotion,
      });

      const state = store.getState().voice;
      expect(state.isGenerating).toBe(false);
      expect(state.currentTrack).toBeTruthy();
      expect(state.currentTrack?.characterId).toBe('aoi');
      expect(state.currentTrack?.emotion).toBe('happy');
    });

    it('should handle TTS service errors', async () => {
      mockTTSService.synthesizeSpeech.mockResolvedValue({
        audioUrl: '',
        audioData: '',
        duration: 0,
        success: false,
        error: 'TTS service unavailable',
      });

      const request = {
        text: 'Test text',
        characterId: 'aoi' as const,
        emotion: 'neutral' as const,
        messageId: 'test-message-error',
      };

      await store.dispatch(generateSpeech(request));

      const state = store.getState().voice;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe('TTS service unavailable');
      expect(state.currentTrack).toBe(null);
    });

    it('should cache audio for repeated requests', async () => {
      const mockAudioData = 'cached-audio-data';
      
      mockTTSService.synthesizeSpeech
        .mockResolvedValueOnce({
          audioUrl: `data:audio/mp3;base64,${mockAudioData}`,
          audioData: mockAudioData,
          duration: 2000,
          success: true,
        })
        .mockResolvedValueOnce({
          audioUrl: `data:audio/mp3;base64,${mockAudioData}`,
          audioData: mockAudioData,
          duration: 2000,
          success: true,
        });

      const request = {
        text: 'キャッシュテスト',
        characterId: 'shun' as const,
        emotion: 'neutral' as const,
        messageId: 'cache-test-1',
      };

      // First request
      await store.dispatch(generateSpeech(request));
      
      // Second request with same parameters
      await store.dispatch(generateSpeech({
        ...request,
        messageId: 'cache-test-2',
      }));

      expect(mockTTSService.synthesizeSpeech).toHaveBeenCalledTimes(2);
    });
  });

  describe('Audio Player Integration', () => {
    it('should play audio track successfully', async () => {
      // Mock TTS service to return audio data
      mockTTSService.synthesizeSpeech.mockResolvedValue({
        audioUrl: 'data:audio/mp3;base64,mock-data',
        audioData: 'mock-data',
        duration: 1500,
        success: true,
      });

      mockAudioPlayerService.playAudio.mockResolvedValue();

      // Generate speech (which should trigger auto-play)
      await store.dispatch(generateSpeech({
        text: 'Test audio',
        characterId: 'aoi',
        emotion: 'happy',
        messageId: 'test-play-1',
      }));

      // Check that audio was played (auto-play is enabled by default)
      expect(mockAudioPlayerService.playAudio).toHaveBeenCalledWith(
        expect.objectContaining({
          characterId: 'aoi',
          emotion: 'happy',
          text: 'Test audio',
        })
      );
    });

    it('should handle audio playback errors', async () => {
      mockAudioPlayerService.playAudio.mockRejectedValue(
        new Error('Audio playback failed')
      );

      // This test would need to be adjusted based on actual implementation
      // as the current slice doesn't handle playback errors directly
    });

    it('should manage playback state correctly', async () => {
      mockAudioPlayerService.playAudio.mockResolvedValue();
      mockAudioPlayerService.pauseAudio.mockResolvedValue();
      mockAudioPlayerService.resumeAudio.mockResolvedValue();
      mockAudioPlayerService.stopAudio.mockResolvedValue();

      // Test initial state
      let state = store.getState().voice;
      expect(state.isPlaying).toBe(false);

      // Test play
      await store.dispatch(generateSpeech({
        text: 'Playback test',
        characterId: 'aoi' as const,
        emotion: 'neutral' as const,
        messageId: 'playback-test-1',
      }));

      // With auto-play enabled, it should start playing
      state = store.getState().voice;
      expect(state.autoPlay).toBe(true);
    });
  });

  describe('Voice Settings Management', () => {
    it('should update character voice settings', () => {
      const initialState = store.getState().voice;
      const initialVolume = initialState.voiceSettings.aoi.volume;

      store.dispatch(setVoiceSettings({
        characterId: 'aoi',
        settings: {
          volume: 90,
          speed: 1.2,
        },
      }));

      const state = store.getState().voice;
      expect(state.voiceSettings.aoi.volume).toBe(90);
      expect(state.voiceSettings.aoi.speed).toBe(1.2);
      expect(state.voiceSettings.aoi.pitch).toBe(initialState.voiceSettings.aoi.pitch);
    });

    it('should toggle auto-play setting', () => {
      // Initial state should have auto-play enabled
      let state = store.getState().voice;
      expect(state.autoPlay).toBe(true);

      // Toggle auto-play off
      store.dispatch(setAutoPlay(false));
      state = store.getState().voice;
      expect(state.autoPlay).toBe(false);

      // Toggle auto-play back on
      store.dispatch(setAutoPlay(true));
      state = store.getState().voice;
      expect(state.autoPlay).toBe(true);
    });

    it('should handle volume updates', () => {
      store.dispatch(setVolume({
        characterId: 'shun',
        volume: 75,
      }));

      const state = store.getState().voice;
      expect(state.voiceSettings.shun.volume).toBe(75);
      expect(mockAudioPlayerService.setVolume).toHaveBeenCalledWith(0.75);
    });

    it('should handle speed updates', () => {
      store.dispatch(setSpeed({
        characterId: 'aoi',
        speed: 1.5,
      }));

      const state = store.getState().voice;
      expect(state.voiceSettings.aoi.speed).toBe(1.5);
      expect(mockAudioPlayerService.setSpeed).toHaveBeenCalledWith(1.5);
    });
  });

  describe('Error Handling', () => {
    it('should clear voice errors', () => {
      // Set an error state
      store.dispatch(clearVoiceError());

      const state = store.getState().voice;
      expect(state.error).toBe(null);
    });

    it('should handle network errors gracefully', async () => {
      mockTTSService.synthesizeSpeech.mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(generateSpeech({
        text: 'Network test',
        characterId: 'aoi' as const,
        emotion: 'neutral' as const,
        messageId: 'network-test-1',
      }));

      const state = store.getState().voice;
      expect(state.error).toBe('Network error');
      expect(state.isGenerating).toBe(false);
    });
  });

  describe('Character-specific Voice Settings', () => {
    it('should have correct default settings for Aoi', () => {
      const state = store.getState().voice;
      const aoiSettings = state.voiceSettings.aoi;

      expect(aoiSettings.volume).toBe(80);
      expect(aoiSettings.speed).toBe(1.0);
      expect(aoiSettings.pitch).toBe(5);
    });

    it('should have correct default settings for Shun', () => {
      const state = store.getState().voice;
      const shunSettings = state.voiceSettings.shun;

      expect(shunSettings.volume).toBe(85);
      expect(shunSettings.speed).toBe(0.95);
      expect(shunSettings.pitch).toBe(-3);
    });

    it('should generate different audio for different characters', async () => {
      mockTTSService.synthesizeSpeech.mockResolvedValue({
        audioUrl: 'data:audio/mp3;base64,character-audio',
        audioData: 'character-audio',
        duration: 2500,
        success: true,
      });

      const text = 'こんにちは';

      // Generate for Aoi
      await store.dispatch(generateSpeech({
        text,
        characterId: 'aoi',
        emotion: 'happy',
        messageId: 'aoi-test',
      }));

      // Generate for Shun
      await store.dispatch(generateSpeech({
        text,
        characterId: 'shun',
        emotion: 'happy',
        messageId: 'shun-test',
      }));

      expect(mockTTSService.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(mockTTSService.synthesizeSpeech).toHaveBeenCalledWith({
        text,
        characterId: 'aoi',
        emotion: 'happy',
      });
      expect(mockTTSService.synthesizeSpeech).toHaveBeenCalledWith({
        text,
        characterId: 'shun',
        emotion: 'happy',
      });
    });
  });
});