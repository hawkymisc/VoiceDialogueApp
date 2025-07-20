import {ttsService} from '../ttsService';
import {VoiceSettings} from '../../types/Character';

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
  paused: true,
  ended: false,
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ttsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('synthesizeSpeech', () => {
    it('should generate speech for given text', async () => {
      const mockAudioUrl = 'https://example.com/audio.mp3';
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mock audio data'], {type: 'audio/mpeg'}),
      });

      global.URL.createObjectURL = jest.fn().mockReturnValue(mockAudioUrl);

      const voiceSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      const result = await ttsService.synthesizeSpeech(
        'こんにちは、元気ですか？',
        voiceSettings
      );

      expect(result).toBe(mockAudioUrl);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('こんにちは、元気ですか？'),
        })
      );
    });

    it('should handle TTS API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const voiceSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      await expect(
        ttsService.synthesizeSpeech('Test text', voiceSettings)
      ).rejects.toThrow('Failed to generate speech: 500 Internal Server Error');
    });

    it('should include voice settings in request', async () => {
      const mockAudioUrl = 'https://example.com/audio.mp3';
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mock audio data'], {type: 'audio/mpeg'}),
      });

      global.URL.createObjectURL = jest.fn().mockReturnValue(mockAudioUrl);

      const voiceSettings: VoiceSettings = {
        pitch: 35,
        tone: 'mature_male',
        speed: 0.9,
        emotionalRange: 60,
        voiceId: 'ja-JP-DaichiNeural',
      };

      await ttsService.synthesizeSpeech('Test text', voiceSettings);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/generate'),
        expect.objectContaining({
          body: expect.stringContaining('ja-JP-DaichiNeural'),
        })
      );
    });
  });

  describe('playAudio', () => {
    it('should play audio from URL', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: true,
        ended: false,
      };

      (global.Audio as jest.Mock).mockReturnValue(mockAudio);

      const audioUrl = 'https://example.com/audio.mp3';
      await ttsService.playAudio(audioUrl);

      expect(global.Audio).toHaveBeenCalledWith(audioUrl);
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should handle audio playback errors', async () => {
      const mockAudio = {
        play: jest.fn().mockRejectedValue(new Error('Audio playback failed')),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: true,
        ended: false,
      };

      (global.Audio as jest.Mock).mockReturnValue(mockAudio);

      const audioUrl = 'https://example.com/audio.mp3';
      
      await expect(ttsService.playAudio(audioUrl)).rejects.toThrow(
        'Audio playback failed'
      );
    });

    it('should set audio volume', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: true,
        ended: false,
      };

      (global.Audio as jest.Mock).mockReturnValue(mockAudio);

      const audioUrl = 'https://example.com/audio.mp3';
      await ttsService.playAudio(audioUrl, 0.5);

      expect(mockAudio.volume).toBe(0.5);
    });
  });

  describe('stopAudio', () => {
    it('should stop current audio playback', () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: false,
        ended: false,
      };

      // Set up current audio
      ttsService.currentAudio = mockAudio as any;

      ttsService.stopAudio();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
      expect(ttsService.currentAudio).toBeNull();
    });

    it('should handle stopping when no audio is playing', () => {
      ttsService.currentAudio = null;

      // Should not throw error
      expect(() => ttsService.stopAudio()).not.toThrow();
    });
  });

  describe('pauseAudio', () => {
    it('should pause current audio playback', () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 30,
        duration: 60,
        volume: 1,
        paused: false,
        ended: false,
      };

      ttsService.currentAudio = mockAudio as any;

      ttsService.pauseAudio();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(30); // Should preserve current time
    });
  });

  describe('resumeAudio', () => {
    it('should resume paused audio playback', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 30,
        duration: 60,
        volume: 1,
        paused: true,
        ended: false,
      };

      ttsService.currentAudio = mockAudio as any;

      await ttsService.resumeAudio();

      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should handle resume errors', async () => {
      const mockAudio = {
        play: jest.fn().mockRejectedValue(new Error('Resume failed')),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 30,
        duration: 60,
        volume: 1,
        paused: true,
        ended: false,
      };

      ttsService.currentAudio = mockAudio as any;

      await expect(ttsService.resumeAudio()).rejects.toThrow('Resume failed');
    });
  });

  describe('setVolume', () => {
    it('should set audio volume', () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: true,
        ended: false,
      };

      ttsService.currentAudio = mockAudio as any;

      ttsService.setVolume(0.7);

      expect(mockAudio.volume).toBe(0.7);
    });

    it('should clamp volume to valid range', () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        paused: true,
        ended: false,
      };

      ttsService.currentAudio = mockAudio as any;

      // Test volume above 1
      ttsService.setVolume(1.5);
      expect(mockAudio.volume).toBe(1);

      // Test volume below 0
      ttsService.setVolume(-0.5);
      expect(mockAudio.volume).toBe(0);
    });
  });

  describe('getAvailableVoices', () => {
    it('should fetch available voices', async () => {
      const mockVoices = [
        {
          id: 'ja-JP-KeitaNeural',
          name: 'Keita (Japanese)',
          language: 'ja-JP',
          gender: 'male',
          type: 'neural',
        },
        {
          id: 'ja-JP-DaichiNeural',
          name: 'Daichi (Japanese)',
          language: 'ja-JP',
          gender: 'male',
          type: 'neural',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoices,
      });

      const result = await ttsService.getAvailableVoices();

      expect(result).toEqual(mockVoices);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/voices'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle voices fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(ttsService.getAvailableVoices()).rejects.toThrow(
        'Failed to fetch voices: 404 Not Found'
      );
    });
  });

  describe('synthesizeWithEmotion', () => {
    it('should synthesize speech with emotion', async () => {
      const mockAudioUrl = 'https://example.com/emotional-audio.mp3';
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mock emotional audio data'], {type: 'audio/mpeg'}),
      });

      global.URL.createObjectURL = jest.fn().mockReturnValue(mockAudioUrl);

      const voiceSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      const result = await ttsService.synthesizeWithEmotion(
        'うれしいです！',
        voiceSettings,
        'happy'
      );

      expect(result).toBe(mockAudioUrl);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/emotion'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('happy'),
        })
      );
    });
  });

  describe('audio event handling', () => {
    it('should handle audio load events', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 60,
        volume: 1,
        paused: true,
        ended: false,
      };

      (global.Audio as jest.Mock).mockReturnValue(mockAudio);

      const audioUrl = 'https://example.com/audio.mp3';
      await ttsService.playAudio(audioUrl);

      // Should have added event listeners
      expect(mockAudio.addEventListener).toHaveBeenCalledWith(
        'loadedmetadata',
        expect.any(Function)
      );
      expect(mockAudio.addEventListener).toHaveBeenCalledWith(
        'ended',
        expect.any(Function)
      );
    });

    it('should handle audio end events', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentTime: 0,
        duration: 60,
        volume: 1,
        paused: true,
        ended: false,
      };

      (global.Audio as jest.Mock).mockReturnValue(mockAudio);

      const audioUrl = 'https://example.com/audio.mp3';
      await ttsService.playAudio(audioUrl);

      // Simulate audio end event
      const endCallback = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'ended'
      )[1];

      endCallback();

      expect(ttsService.currentAudio).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle network errors during speech generation', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const voiceSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      await expect(
        ttsService.synthesizeSpeech('Test text', voiceSettings)
      ).rejects.toThrow('Network error');
    });

    it('should handle blob creation errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => {
          throw new Error('Blob creation failed');
        },
      });

      const voiceSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      await expect(
        ttsService.synthesizeSpeech('Test text', voiceSettings)
      ).rejects.toThrow('Blob creation failed');
    });
  });

  describe('audio format support', () => {
    it('should handle different audio formats', async () => {
      const formats = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

      for (const format of formats) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['mock audio data'], {type: format}),
        });

        global.URL.createObjectURL = jest.fn().mockReturnValue(
          `https://example.com/audio.${format.split('/')[1]}`
        );

        const voiceSettings: VoiceSettings = {
          pitch: 75,
          tone: 'clear_young_male',
          speed: 1.0,
          emotionalRange: 80,
          voiceId: 'ja-JP-KeitaNeural',
        };

        const result = await ttsService.synthesizeSpeech('Test text', voiceSettings);

        expect(result).toContain(format.split('/')[1]);
      }
    });
  });
});