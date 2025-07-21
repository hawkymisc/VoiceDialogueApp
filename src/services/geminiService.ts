import { DialogueRequest, DialogueResponse, EmotionType } from '../types/Dialogue';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class GeminiService {
  private apiKey: string = '';
  private model: string = 'gemini-pro';
  private temperature: number = 0.7;
  private maxTokens: number = 1000;
  private initialized: boolean = false;
  private baseURL: string = 'https://generativelanguage.googleapis.com/v1beta';

  async initialize(config: GeminiConfig): Promise<void> {
    try {
      this.apiKey = config.apiKey;
      this.model = config.model || 'gemini-pro';
      this.temperature = config.temperature || 0.7;
      this.maxTokens = config.maxTokens || 1000;

      // Test API connection
      await this.testConnection();
      this.initialized = true;
      console.log('Gemini service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw new Error('Gemini initialization failed');
    }
  }

  private async testConnection(): Promise<void> {
    const testMessage = 'Hello';
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: testMessage }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API test failed: ${response.status}`);
    }
  }

  async generateDialogue(request: DialogueRequest): Promise<DialogueResponse> {
    if (!this.initialized) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const prompt = this.buildPrompt(request);
      const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('Gemini dialogue generation error:', error);
      throw error;
    }
  }

  private buildPrompt(request: DialogueRequest): string {
    const { characterId, userMessage, conversationHistory, scenario, relationshipContext } = request;

    // Character personality setup
    const characterPrompts = {
      aoi: `あなたは蒼（Aoi）という22歳の美青年キャラクターです。
性格：純真、感情豊か、時に天然、一生懸命
口調：敬語混じりの丁寧語、時々タメ口になる
特徴：相手を思いやる優しさ、素直な反応、照れやすい`,
      shun: `あなたは瞬（Shun）という35歳のイケオジキャラクターです。
性格：落ち着いた大人の魅力、包容力、時に厳しく時に優しい
口調：落ち着いた大人の話し方、相手を気遣う言葉遣い
特徴：経験豊富、頼りがいのある存在、時に照れる一面も`
    };

    const characterPrompt = characterPrompts[characterId as keyof typeof characterPrompts] || characterPrompts.aoi;

    // Build conversation history
    const historyText = conversationHistory.length > 0 
      ? '\n\n過去の会話:\n' + conversationHistory.slice(-5).map(msg => 
          `${msg.sender === 'user' ? 'ユーザー' : characterId}: ${msg.text}`
        ).join('\n')
      : '';

    // Build context
    const contextText = scenario ? `\nシナリオ: ${scenario}` : '';
    const relationshipText = relationshipContext ? `\n関係性: ${relationshipContext}` : '';

    return `${characterPrompt}

${contextText}${relationshipText}${historyText}

ユーザー: ${userMessage}

以下の形式で応答してください：
1. そのキャラクターらしい自然な返答を1-2文で
2. 感情（neutral/happy/sad/angry/surprised/embarrassed）を判定
3. JSON形式で出力

例：
{"text": "そうですね...とても嬉しいです！", "emotion": "happy"}`;
  }

  private parseResponse(data: any): DialogueResponse {
    try {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No content in Gemini response');
      }

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || content,
          emotion: this.validateEmotion(parsed.emotion),
          confidence: 0.8
        };
      }

      // Fallback: use raw content and detect emotion
      return {
        text: content.trim(),
        emotion: this.detectEmotion(content),
        confidence: 0.6
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        text: 'すみません、うまく応答できませんでした...',
        emotion: 'neutral',
        confidence: 0.1
      };
    }
  }

  private validateEmotion(emotion: string): EmotionType {
    const validEmotions: EmotionType[] = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed'];
    return validEmotions.includes(emotion as EmotionType) ? emotion as EmotionType : 'neutral';
  }

  private detectEmotion(text: string): EmotionType {
    // Simple emotion detection based on keywords
    if (text.includes('嬉しい') || text.includes('楽しい') || text.includes('！')) return 'happy';
    if (text.includes('悲しい') || text.includes('残念') || text.includes('つらい')) return 'sad';
    if (text.includes('怒') || text.includes('イライラ') || text.includes('許せない')) return 'angry';
    if (text.includes('驚') || text.includes('びっくり') || text.includes('えっ')) return 'surprised';
    if (text.includes('恥ずかしい') || text.includes('照れ') || text.includes('///')) return 'embarrassed';
    return 'neutral';
  }

  getInitializationStatus(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('Gemini service cleaned up');
  }
}

export const geminiService = new GeminiService();