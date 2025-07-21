import { TTSRequest, TTSResponse } from '../types/Audio';
import { ttsService as azureTTSService } from './ttsService';

export type TTSProvider = 'azure' | 'voicevox' | 'web-speech';

export interface TTSConfig {
  provider: TTSProvider;
  azure?: {
    apiKey: string;
    region: string;
  };
  voicevox?: {
    apiUrl: string;
  };
  webSpeech?: {
    lang: string;
    rate: number;
    pitch: number;
  };
}

// VOICEVOX API client
class VoicevoxTTSService {
  private apiUrl: string = 'http://localhost:50021';
  private initialized: boolean = false;

  async initialize(config: { apiUrl: string }): Promise<void> {
    this.apiUrl = config.apiUrl;
    
    try {
      // Test connection
      const response = await fetch(`${this.apiUrl}/version`);
      if (!response.ok) {
        throw new Error('VOICEVOX server not responding');
      }
      this.initialized = true;
      console.log('VOICEVOX TTS service initialized');
    } catch (error) {
      console.error('Failed to initialize VOICEVOX:', error);
      throw new Error('VOICEVOX initialization failed');
    }
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (!this.initialized) {
      throw new Error('VOICEVOX service not initialized');
    }

    try {
      // Speaker mapping for characters
      const speakerMap = {
        aoi: 1, // 四国めたん(ノーマル)
        shun: 2  // 四国めたん(あまあま)
      };
      
      const speaker = speakerMap[request.characterId as keyof typeof speakerMap] || 1;

      // Generate audio query
      const queryResponse = await fetch(
        `${this.apiUrl}/audio_query?text=${encodeURIComponent(request.text)}&speaker=${speaker}`,
        { method: 'POST' }
      );

      if (!queryResponse.ok) {
        throw new Error('VOICEVOX audio query failed');
      }

      const audioQuery = await queryResponse.json();

      // Apply emotion adjustments
      if (request.emotion && request.emotion !== 'neutral') {
        audioQuery.speedScale = this.getSpeedForEmotion(request.emotion);
        audioQuery.pitchScale = this.getPitchForEmotion(request.emotion);
        audioQuery.intonationScale = this.getIntonationForEmotion(request.emotion);
      }

      // Generate audio
      const audioResponse = await fetch(
        `${this.apiUrl}/synthesis?speaker=${speaker}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(audioQuery)
        }
      );

      if (!audioResponse.ok) {
        throw new Error('VOICEVOX synthesis failed');
      }

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        duration: audioQuery.outputSamplingRate ? audioQuery.outputSamplingRate / 24000 : 2,
        success: true
      };

    } catch (error) {
      console.error('VOICEVOX synthesis error:', error);
      return {
        audioUrl: '',
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'VOICEVOX synthesis failed'
      };
    }
  }

  private getSpeedForEmotion(emotion: string): number {
    switch (emotion) {
      case 'happy': return 1.1;
      case 'excited': return 1.2;
      case 'sad': return 0.8;
      case 'angry': return 1.15;
      case 'surprised': return 1.3;
      case 'embarrassed': return 0.9;
      default: return 1.0;
    }
  }

  private getPitchForEmotion(emotion: string): number {
    switch (emotion) {
      case 'happy': return 0.1;
      case 'excited': return 0.2;
      case 'sad': return -0.2;
      case 'angry': return 0.15;
      case 'surprised': return 0.25;
      case 'embarrassed': return -0.1;
      default: return 0.0;
    }
  }

  private getIntonationForEmotion(emotion: string): number {
    switch (emotion) {
      case 'happy': return 1.2;
      case 'excited': return 1.3;
      case 'sad': return 0.8;
      case 'angry': return 1.1;
      case 'surprised': return 1.4;
      case 'embarrassed': return 0.9;
      default: return 1.0;
    }
  }

  getInitializationStatus(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
  }
}

// Web Speech API service
class WebSpeechTTSService {
  private initialized: boolean = false;
  private config = {
    lang: 'ja-JP',
    rate: 1.0,
    pitch: 1.0
  };

  async initialize(config: { lang: string; rate: number; pitch: number }): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Web Speech API not supported');
    }
    
    this.config = { ...this.config, ...config };
    this.initialized = true;
    console.log('Web Speech TTS service initialized');
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (!this.initialized || !('speechSynthesis' in window)) {
      throw new Error('Web Speech TTS not available');
    }

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(request.text);
        utterance.lang = this.config.lang;
        utterance.rate = this.config.rate;
        utterance.pitch = this.config.pitch;

        // Character voice selection
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.includes('ja')) || voices[0];
        if (voice) utterance.voice = voice;

        // Emotion adjustments
        if (request.emotion) {
          utterance.rate = this.getEmotionalRate(request.emotion);
          utterance.pitch = this.getEmotionalPitch(request.emotion);
        }

        utterance.onend = () => {
          resolve({
            audioUrl: '', // Web Speech doesn't provide URL
            duration: request.text.length * 0.1, // Estimate
            success: true
          });
        };

        utterance.onerror = (error) => {
          resolve({
            audioUrl: '',
            duration: 0,
            success: false,
            error: 'Web Speech synthesis failed'
          });
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        resolve({
          audioUrl: '',
          duration: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Web Speech error'
        });
      }
    });
  }

  private getEmotionalRate(emotion: string): number {
    switch (emotion) {
      case 'happy': return 1.1;
      case 'excited': return 1.2;
      case 'sad': return 0.8;
      case 'angry': return 1.1;
      case 'surprised': return 1.3;
      case 'embarrassed': return 0.9;
      default: return 1.0;
    }
  }

  private getEmotionalPitch(emotion: string): number {
    switch (emotion) {
      case 'happy': return 1.2;
      case 'excited': return 1.3;
      case 'sad': return 0.8;
      case 'angry': return 1.1;
      case 'surprised': return 1.4;
      case 'embarrassed': return 0.9;
      default: return 1.0;
    }
  }

  getInitializationStatus(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.initialized = false;
  }
}

// Main TTS provider service
class TTSProviderService {
  private currentProvider: TTSProvider = 'web-speech';
  private azureService = azureTTSService;
  private voicevoxService = new VoicevoxTTSService();
  private webSpeechService = new WebSpeechTTSService();
  private initialized: boolean = false;

  async initialize(config: TTSConfig): Promise<void> {
    try {
      this.currentProvider = config.provider;

      switch (config.provider) {
        case 'azure':
          if (!config.azure?.apiKey || !config.azure?.region) {
            throw new Error('Azure TTS credentials are required');
          }
          await this.azureService.initialize({
            apiKey: config.azure.apiKey,
            region: config.azure.region
          });
          break;

        case 'voicevox':
          await this.voicevoxService.initialize({
            apiUrl: config.voicevox?.apiUrl || 'http://localhost:50021'
          });
          break;

        case 'web-speech':
          await this.webSpeechService.initialize({
            lang: config.webSpeech?.lang || 'ja-JP',
            rate: config.webSpeech?.rate || 1.0,
            pitch: config.webSpeech?.pitch || 1.0
          });
          break;

        default:
          throw new Error(`Unsupported TTS provider: ${config.provider}`);
      }

      this.initialized = true;
      console.log(`TTS service initialized with provider: ${this.currentProvider}`);
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      throw error;
    }
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (!this.initialized) {
      throw new Error('TTS service not initialized');
    }

    try {
      switch (this.currentProvider) {
        case 'azure':
          return await this.azureService.synthesize(request);
        case 'voicevox':
          return await this.voicevoxService.synthesize(request);
        case 'web-speech':
          return await this.webSpeechService.synthesize(request);
        default:
          throw new Error(`Unsupported provider: ${this.currentProvider}`);
      }
    } catch (error) {
      console.error(`${this.currentProvider} TTS error:`, error);
      
      // Fallback to web speech if available
      if (this.currentProvider !== 'web-speech' && 'speechSynthesis' in window) {
        console.log('Falling back to Web Speech API');
        return await this.webSpeechService.synthesize(request);
      }

      return {
        audioUrl: '',
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'TTS synthesis failed'
      };
    }
  }

  getCurrentProvider(): TTSProvider {
    return this.currentProvider;
  }

  getInitializationStatus(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.azureService.cleanup(),
      this.voicevoxService.cleanup(),
      this.webSpeechService.cleanup()
    ]);
    this.initialized = false;
    console.log('TTS provider service cleaned up');
  }
}

export const ttsProviderService = new TTSProviderService();