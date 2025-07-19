import OpenAI from 'openai';
import {CharacterType} from '../types/Character';
import {DialogueMessage, EmotionState} from '../types/Dialogue';
import {CHARACTER_PROMPTS} from '../data/characters';
import {contentFilterService} from './contentFilterService';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

interface DialogueRequest {
  characterId: CharacterType;
  userMessage: string;
  conversationHistory: DialogueMessage[];
  scenario?: string;
  relationshipContext?: string;
  personalityTraits?: Record<string, number>;
  userId?: string;
}

interface DialogueResponse {
  text: string;
  emotion: EmotionState;
  confidence: number;
  filtered?: boolean;
  contentWarnings?: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface EmotionAnalysisResult {
  primaryEmotion: EmotionState;
  emotions: Record<EmotionState, number>;
  confidence: number;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // In a real app, you would get this from environment variables or secure storage
      const apiKey = process.env.OPENAI_API_KEY || '';
      
      if (!apiKey) {
        console.warn('OpenAI API key not provided. Service will not be available.');
        return;
      }

      const config: OpenAIConfig = {
        apiKey,
        organization: process.env.OPENAI_ORGANIZATION,
        baseURL: process.env.OPENAI_BASE_URL,
      };

      this.client = new OpenAI(config);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI initialization failed');
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.client) {
      throw new Error('OpenAI service not initialized');
    }
  }

  /**
   * Check if the service is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate dialogue response from character
   */
  async generateDialogue(request: DialogueRequest): Promise<DialogueResponse> {
    this.ensureInitialized();

    try {
      // ユーザーメッセージのコンテンツフィルタリング
      let userMessage = request.userMessage;
      let contentWarnings: string[] = [];
      let filtered = false;

      if (request.userId) {
        const userScanResult = await contentFilterService.scanContent(
          request.userMessage,
          'dialogue',
          request.userId
        );

        if (!userScanResult.isAllowed) {
          throw new Error('ユーザーメッセージが不適切なコンテンツを含んでいます');
        }

        if (userScanResult.filteredContent) {
          userMessage = userScanResult.filteredContent;
          filtered = true;
        }

        if (userScanResult.detectedIssues.length > 0) {
          contentWarnings = userScanResult.detectedIssues.map(issue => issue.description);
        }
      }

      const systemPrompt = this.buildSystemPrompt({...request, userMessage});
      const messages = this.buildMessageHistory({...request, userMessage}, systemPrompt);

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        stop: ['\\n\\n', '---'],
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response generated');
      }

      let generatedText = choice.message.content.trim();
      
      // 生成されたレスポンスのコンテンツフィルタリング
      if (request.userId) {
        const responseScanResult = await contentFilterService.scanContent(
          generatedText,
          'dialogue',
          request.userId
        );

        if (!responseScanResult.isAllowed) {
          // 不適切なコンテンツが生成された場合の代替レスポンス
          generatedText = 'すみません、適切な応答を生成できませんでした。別の話題について話しませんか？';
          filtered = true;
        } else if (responseScanResult.filteredContent) {
          generatedText = responseScanResult.filteredContent;
          filtered = true;
        }

        if (responseScanResult.detectedIssues.length > 0) {
          contentWarnings.push(...responseScanResult.detectedIssues.map(issue => issue.description));
        }
      }
      
      // Analyze emotion from the generated text
      const emotionAnalysis = await this.analyzeEmotion(generatedText);

      return {
        text: generatedText,
        emotion: emotionAnalysis.primaryEmotion,
        confidence: emotionAnalysis.confidence,
        filtered,
        contentWarnings: contentWarnings.length > 0 ? contentWarnings : undefined,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      throw new Error(`Dialogue generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze emotion from text
   */
  async analyzeEmotion(text: string): Promise<EmotionAnalysisResult> {
    this.ensureInitialized();

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `あなたは感情分析の専門家です。与えられた日本語テキストから感情を分析してください。
            
感情カテゴリ：
- neutral: 中立的、普通
- happy: 嬉しい、楽しい、興奮
- sad: 悲しい、落ち込んだ、寂しい
- angry: 怒っている、イライラした
- surprised: 驚いた、びっくりした
- embarrassed: 恥ずかしい、照れた

以下のJSON形式で回答してください：
{
  "primaryEmotion": "感情名",
  "emotions": {
    "neutral": 0.0-1.0の値,
    "happy": 0.0-1.0の値,
    "sad": 0.0-1.0の値,
    "angry": 0.0-1.0の値,
    "surprised": 0.0-1.0の値,
    "embarrassed": 0.0-1.0の値
  },
  "confidence": 0.0-1.0の値
}`
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No emotion analysis response');
      }

      const analysisResult = JSON.parse(content);
      return {
        primaryEmotion: analysisResult.primaryEmotion as EmotionState,
        emotions: analysisResult.emotions,
        confidence: analysisResult.confidence,
      };
    } catch (error) {
      console.error('Failed to analyze emotion:', error);
      
      // Fallback to neutral emotion
      return {
        primaryEmotion: 'neutral',
        emotions: {
          neutral: 1.0,
          happy: 0.0,
          sad: 0.0,
          angry: 0.0,
          surprised: 0.0,
          embarrassed: 0.0,
        },
        confidence: 0.5,
      };
    }
  }

  /**
   * Build system prompt for character
   */
  private buildSystemPrompt(request: DialogueRequest): string {
    const basePrompt = CHARACTER_PROMPTS[request.characterId];
    let systemPrompt = basePrompt;

    // Add relationship context
    if (request.relationshipContext) {
      systemPrompt += `\n\n関係性: ${request.relationshipContext}`;
    }

    // Add scenario context
    if (request.scenario) {
      systemPrompt += `\n\nシナリオ: ${request.scenario}`;
    }

    // Add personality traits
    if (request.personalityTraits) {
      const traits = Object.entries(request.personalityTraits)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      systemPrompt += `\n\n現在の性格パラメータ: ${traits}`;
    }

    // Add instructions
    systemPrompt += `\n\n指示:
- 自然な日本語で応答してください
- キャラクターの設定に忠実に応答してください
- 150文字以内で簡潔に答えてください
- 感情豊かな表現を使ってください
- 相手との関係性を考慮してください`;

    return systemPrompt;
  }

  /**
   * Build message history for API
   */
  private buildMessageHistory(request: DialogueRequest, systemPrompt: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add recent conversation history (last 10 messages)
    const recentHistory = request.conversationHistory.slice(-10);
    
    for (const message of recentHistory) {
      messages.push({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: request.userMessage,
    });

    return messages;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const response = await this.client!.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.error('Failed to get available models:', error);
      throw new Error('Failed to retrieve models');
    }
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.client!.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    totalRequests: number;
    totalTokens: number;
    averageTokensPerRequest: number;
  }> {
    // This would typically be stored in a database or analytics service
    // For now, return mock data
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageTokensPerRequest: 0,
    };
  }

  /**
   * Summarize conversation for conversation service
   */
  async summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `あなたは会話の要約専門家です。与えられた会話を簡潔に要約してください。
            
要約は以下の点を含めてください：
- 会話の主なトピック
- 感情的なハイライト
- 重要なやり取り
- 関係性の変化

100文字以内で簡潔に要約してください。`,
          },
          {
            role: 'user',
            content: `以下の会話を要約してください：\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return '会話の要約を生成できませんでした。';
      }

      return content;
    } catch (error) {
      console.error('Failed to summarize conversation:', error);
      return '会話の要約を生成中にエラーが発生しました。';
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;