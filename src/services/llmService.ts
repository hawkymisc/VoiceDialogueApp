import { DialogueRequest, DialogueResponse } from '../types/Dialogue';
import { openaiService } from './openaiService';
import { geminiService, GeminiConfig } from './geminiService';

export type LLMProvider = 'openai' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  openai?: {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  gemini?: GeminiConfig;
}

class LLMService {
  private currentProvider: LLMProvider = 'openai';
  private initialized: boolean = false;

  async initialize(config: LLMConfig): Promise<void> {
    try {
      this.currentProvider = config.provider;

      switch (config.provider) {
        case 'openai':
          if (!config.openai?.apiKey) {
            throw new Error('OpenAI API key is required');
          }
          await openaiService.initialize({
            apiKey: config.openai.apiKey,
            model: config.openai.model || 'gpt-3.5-turbo',
            temperature: config.openai.temperature || 0.7,
            maxTokens: config.openai.maxTokens || 1000
          });
          break;

        case 'gemini':
          if (!config.gemini?.apiKey) {
            throw new Error('Gemini API key is required');
          }
          await geminiService.initialize(config.gemini);
          break;

        default:
          throw new Error(`Unsupported LLM provider: ${config.provider}`);
      }

      this.initialized = true;
      console.log(`LLM service initialized with provider: ${this.currentProvider}`);
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      throw error;
    }
  }

  async generateDialogue(request: DialogueRequest): Promise<DialogueResponse> {
    if (!this.initialized) {
      throw new Error('LLM service not initialized');
    }

    try {
      switch (this.currentProvider) {
        case 'openai':
          return await openaiService.generateDialogue(request);
        case 'gemini':
          return await geminiService.generateDialogue(request);
        default:
          throw new Error(`Unsupported provider: ${this.currentProvider}`);
      }
    } catch (error) {
      console.error(`${this.currentProvider} dialogue generation error:`, error);
      
      // Fallback response
      return {
        text: 'すみません、今少し調子が悪くて...また後で話しかけてくださいね。',
        emotion: 'embarrassed',
        confidence: 0.1
      };
    }
  }

  getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }

  getInitializationStatus(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    switch (this.currentProvider) {
      case 'openai':
        await openaiService.cleanup();
        break;
      case 'gemini':
        await geminiService.cleanup();
        break;
    }
    this.initialized = false;
    console.log('LLM service cleaned up');
  }
}

export const llmService = new LLMService();