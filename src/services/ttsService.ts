import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import RNFS from 'react-native-fs';
import {CharacterType} from '../types/Character';
import {EmotionState} from '../types/Dialogue';

export interface TTSConfig {
  subscriptionKey: string;
  serviceRegion: string;
}

export interface VoiceSettings {
  voiceId: string;
  pitch: number;
  rate: number;
  volume: number;
}

export interface TTSRequest {
  text: string;
  characterId: CharacterType;
  emotion: EmotionState;
  voiceSettings?: Partial<VoiceSettings>;
}

export interface TTSResponse {
  audioUrl: string;
  audioData: string; // Base64 encoded audio data
  duration: number; // in milliseconds
  success: boolean;
  error?: string;
}

export interface SSMLOptions {
  emotion: EmotionState;
  intensity: number; // 0.0 - 1.0
  pitch: number; // -50 to +50
  rate: number; // 0.5 to 2.0
  volume: number; // 0.0 to 1.0
}

class TTSService {
  private speechConfig: sdk.SpeechConfig | null = null;
  private isInitialized = false;
  private audioCache = new Map<string, string>();

  // キャラクター別音声設定
  private readonly CHARACTER_VOICES: Record<CharacterType, VoiceSettings> = {
    aoi: {
      voiceId: 'ja-JP-KeitaNeural',
      pitch: 5, // 高めの透明感のある声
      rate: 1.0,
      volume: 0.8,
    },
    shun: {
      voiceId: 'ja-JP-DaichiNeural',
      pitch: -5, // 低めの落ち着いた声
      rate: 0.9,
      volume: 0.9,
    },
  };

  // 感情別音声調整
  private readonly EMOTION_ADJUSTMENTS: Record<EmotionState, Partial<SSMLOptions>> = {
    neutral: {
      intensity: 0.5,
      pitch: 0,
      rate: 1.0,
    },
    happy: {
      intensity: 0.8,
      pitch: 10,
      rate: 1.1,
    },
    sad: {
      intensity: 0.6,
      pitch: -10,
      rate: 0.9,
    },
    angry: {
      intensity: 0.9,
      pitch: 5,
      rate: 1.2,
    },
    surprised: {
      intensity: 0.8,
      pitch: 15,
      rate: 1.3,
    },
    embarrassed: {
      intensity: 0.7,
      pitch: 8,
      rate: 0.8,
    },
  };

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // In a real app, you would get these from environment variables or secure storage
      const subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
      const serviceRegion = process.env.AZURE_SPEECH_REGION || 'japaneast';

      if (!subscriptionKey) {
        console.warn('Azure Speech API key not provided. TTS service will not be available.');
        return;
      }

      this.speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
      this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
      this.isInitialized = true;

      console.log('TTS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      throw new Error('TTS service initialization failed');
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.speechConfig) {
      throw new Error('TTS service not initialized');
    }
  }

  /**
   * Check if the service is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate SSML with emotion and voice settings
   */
  private generateSSML(text: string, characterId: CharacterType, emotion: EmotionState, customSettings?: Partial<VoiceSettings>): string {
    const voiceSettings = {...this.CHARACTER_VOICES[characterId], ...customSettings};
    const emotionSettings = this.EMOTION_ADJUSTMENTS[emotion];
    
    const finalPitch = voiceSettings.pitch + (emotionSettings.pitch || 0);
    const finalRate = voiceSettings.rate * (emotionSettings.rate || 1.0);
    const finalVolume = voiceSettings.volume * (emotionSettings.volume || 1.0);

    // Convert emotion to SSML style
    const emotionStyle = this.getEmotionStyle(emotion);
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="ja-JP">
        <voice name="${voiceSettings.voiceId}">
          <mstts:express-as style="${emotionStyle}" styledegree="${emotionSettings.intensity || 0.5}">
            <prosody pitch="${finalPitch > 0 ? '+' : ''}${finalPitch}%" 
                     rate="${finalRate}" 
                     volume="${Math.round(finalVolume * 100)}">
              ${text}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `;

    return ssml.trim();
  }

  /**
   * Convert emotion state to SSML style
   */
  private getEmotionStyle(emotion: EmotionState): string {
    const emotionMap: Record<EmotionState, string> = {
      neutral: 'general',
      happy: 'cheerful',
      sad: 'sad',
      angry: 'angry',
      surprised: 'excited',
      embarrassed: 'gentle',
    };

    return emotionMap[emotion] || 'general';
  }

  /**
   * Generate cache key for audio
   */
  private getCacheKey(text: string, characterId: CharacterType, emotion: EmotionState, voiceSettings?: Partial<VoiceSettings>): string {
    const settingsHash = JSON.stringify(voiceSettings || {});
    return `${characterId}_${emotion}_${Buffer.from(text).toString('base64').substring(0, 32)}_${Buffer.from(settingsHash).toString('base64').substring(0, 16)}`;
  }

  /**
   * Generate speech audio from text
   */
  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    this.ensureInitialized();

    try {
      const cacheKey = this.getCacheKey(request.text, request.characterId, request.emotion, request.voiceSettings);
      
      // Check cache first
      if (this.audioCache.has(cacheKey)) {
        const cachedAudioData = this.audioCache.get(cacheKey)!;
        return {
          audioUrl: `data:audio/mp3;base64,${cachedAudioData}`,
          audioData: cachedAudioData,
          duration: this.estimateAudioDuration(request.text),
          success: true,
        };
      }

      // Generate SSML
      const ssml = this.generateSSML(request.text, request.characterId, request.emotion, request.voiceSettings);

      // Create synthesizer
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig!, null);

      return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const audioData = Buffer.from(result.audioData).toString('base64');
              
              // Cache the audio
              this.audioCache.set(cacheKey, audioData);
              
              resolve({
                audioUrl: `data:audio/mp3;base64,${audioData}`,
                audioData,
                duration: this.estimateAudioDuration(request.text),
                success: true,
              });
            } else {
              reject(new Error(`Speech synthesis failed: ${result.reason}`));
            }
            synthesizer.close();
          },
          (error) => {
            console.error('Speech synthesis error:', error);
            synthesizer.close();
            reject(new Error(`Speech synthesis error: ${error}`));
          }
        );
      });
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      return {
        audioUrl: '',
        audioData: '',
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save audio to file
   */
  async saveAudioToFile(audioData: string, filename: string): Promise<string> {
    try {
      const audioDir = `${RNFS.DocumentDirectoryPath}/audio`;
      
      // Create audio directory if it doesn't exist
      const dirExists = await RNFS.exists(audioDir);
      if (!dirExists) {
        await RNFS.mkdir(audioDir);
      }

      const filePath = `${audioDir}/${filename}.mp3`;
      await RNFS.writeFile(filePath, audioData, 'base64');

      return filePath;
    } catch (error) {
      console.error('Failed to save audio file:', error);
      throw new Error('Failed to save audio file');
    }
  }

  /**
   * Get cached audio
   */
  getCachedAudio(text: string, characterId: CharacterType, emotion: EmotionState, voiceSettings?: Partial<VoiceSettings>): string | null {
    const cacheKey = this.getCacheKey(text, characterId, emotion, voiceSettings);
    return this.audioCache.get(cacheKey) || null;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.audioCache.size;
  }

  /**
   * Estimate audio duration based on text length
   */
  private estimateAudioDuration(text: string): number {
    // Rough estimation: 100 characters per minute for Japanese
    const charactersPerMinute = 100;
    const durationInMinutes = text.length / charactersPerMinute;
    return Math.max(1000, Math.round(durationInMinutes * 60 * 1000)); // minimum 1 second
  }

  /**
   * Get available voices for a character
   */
  getCharacterVoices(characterId: CharacterType): VoiceSettings {
    return this.CHARACTER_VOICES[characterId];
  }

  /**
   * Update character voice settings
   */
  updateCharacterVoice(characterId: CharacterType, settings: Partial<VoiceSettings>): void {
    this.CHARACTER_VOICES[characterId] = {
      ...this.CHARACTER_VOICES[characterId],
      ...settings,
    };
  }

  /**
   * Get emotion adjustments
   */
  getEmotionAdjustments(): Record<EmotionState, Partial<SSMLOptions>> {
    return this.EMOTION_ADJUSTMENTS;
  }

  /**
   * Test speech synthesis
   */
  async testSynthesis(characterId: CharacterType): Promise<boolean> {
    try {
      const testText = characterId === 'aoi' ? 'こんにちは、蒼です。' : 'こんにちは、瞬です。';
      const result = await this.synthesizeSpeech({
        text: testText,
        characterId,
        emotion: 'happy',
      });
      
      return result.success;
    } catch (error) {
      console.error('TTS test failed:', error);
      return false;
    }
  }
}

export const ttsService = new TTSService();