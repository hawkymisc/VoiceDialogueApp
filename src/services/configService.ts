import { LLMConfig, LLMProvider } from './llmService';
import { TTSConfig, TTSProvider } from './ttsProviderService';

export interface AppConfig {
  llm: LLMConfig;
  tts: TTSConfig;
}

class ConfigService {
  private config: AppConfig | null = null;

  loadConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // Environment variables with fallbacks
    const env = {
      // LLM Configuration
      LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-pro',
      
      // TTS Configuration
      TTS_PROVIDER: process.env.TTS_PROVIDER || 'web-speech',
      AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || '',
      AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || 'japaneast',
      VOICEVOX_API_URL: process.env.VOICEVOX_API_URL || 'http://localhost:50021',
    };

    console.log('Loading configuration with providers:', {
      llm: env.LLM_PROVIDER,
      tts: env.TTS_PROVIDER
    });

    // Build LLM config
    const llmProvider = env.LLM_PROVIDER as LLMProvider;
    const llmConfig: LLMConfig = {
      provider: llmProvider,
    };

    if (llmProvider === 'openai') {
      if (!env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, falling back to Gemini');
        llmConfig.provider = 'gemini';
      } else {
        llmConfig.openai = {
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          temperature: 0.7,
          maxTokens: 1000
        };
      }
    }

    if (llmConfig.provider === 'gemini') {
      if (!env.GEMINI_API_KEY) {
        console.error('Gemini API key is required when using Gemini provider');
        // Don't throw error in web environment, will handle gracefully
      }
      llmConfig.gemini = {
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        temperature: 0.7,
        maxTokens: 1000
      };
    }

    // Build TTS config
    const ttsProvider = env.TTS_PROVIDER as TTSProvider;
    const ttsConfig: TTSConfig = {
      provider: ttsProvider,
    };

    switch (ttsProvider) {
      case 'azure':
        if (!env.AZURE_SPEECH_KEY) {
          console.warn('Azure Speech key not found, falling back to Web Speech');
          ttsConfig.provider = 'web-speech';
          ttsConfig.webSpeech = {
            lang: 'ja-JP',
            rate: 1.0,
            pitch: 1.0
          };
        } else {
          ttsConfig.azure = {
            apiKey: env.AZURE_SPEECH_KEY,
            region: env.AZURE_SPEECH_REGION
          };
        }
        break;

      case 'voicevox':
        ttsConfig.voicevox = {
          apiUrl: env.VOICEVOX_API_URL
        };
        break;

      case 'web-speech':
      default:
        ttsConfig.provider = 'web-speech';
        ttsConfig.webSpeech = {
          lang: 'ja-JP',
          rate: 1.0,
          pitch: 1.0
        };
        break;
    }

    this.config = {
      llm: llmConfig,
      tts: ttsConfig
    };

    return this.config;
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  // Helper methods for checking available services
  isLLMConfigured(): boolean {
    const config = this.loadConfig();
    
    if (config.llm.provider === 'openai') {
      return !!config.llm.openai?.apiKey;
    }
    
    if (config.llm.provider === 'gemini') {
      return !!config.llm.gemini?.apiKey;
    }
    
    return false;
  }

  isTTSConfigured(): boolean {
    const config = this.loadConfig();
    
    switch (config.tts.provider) {
      case 'azure':
        return !!config.tts.azure?.apiKey;
      case 'voicevox':
        return !!config.tts.voicevox?.apiUrl;
      case 'web-speech':
        return true; // Always available in modern browsers
      default:
        return false;
    }
  }

  getProviderStatus() {
    const config = this.loadConfig();
    return {
      llm: {
        provider: config.llm.provider,
        configured: this.isLLMConfigured(),
        available: this.isLLMConfigured()
      },
      tts: {
        provider: config.tts.provider,
        configured: this.isTTSConfigured(),
        available: this.isTTSConfigured()
      }
    };
  }

  // Generate example .env content
  generateExampleEnv(): string {
    return `# LLM Provider Configuration
# Choose: 'openai' or 'gemini'
LLM_PROVIDER=gemini

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Gemini Configuration (if using Gemini)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro

# TTS Provider Configuration  
# Choose: 'azure', 'voicevox', or 'web-speech'
TTS_PROVIDER=web-speech

# Azure TTS Configuration (if using Azure)
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=japaneast

# VOICEVOX Configuration (if using VOICEVOX)
VOICEVOX_API_URL=http://localhost:50021`;
  }
}

export const configService = new ConfigService();