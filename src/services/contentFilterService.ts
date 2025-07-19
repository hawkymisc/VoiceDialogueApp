import {
  ContentFilter,
  ContentRating,
  ContentRatingGuideline,
  ContentScanResult,
  UserContentPreferences,
  ContentModerationReport,
  ContentCategory,
} from '../types/ContentSecurity';
import {storageService} from './storageService';
import {EmotionType} from '../types/Dialogue';

class ContentFilterService {
  private filters: ContentFilter[] = [];
  private guidelines: Record<ContentRating, ContentRatingGuideline> = {};
  private userPreferences: Map<string, UserContentPreferences> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeFilters();
    this.initializeGuidelines();
  }

  private initializeFilters(): void {
    this.filters = [
      {
        id: 'profanity_filter',
        name: '不適切な言葉フィルター',
        description: '不適切な言葉や表現を検出',
        category: 'dialogue',
        patterns: [
          // 基本的な不適切語のパターン（実際の実装では外部データベースを使用）
          '\\b(不適切語1|不適切語2)\\b',
          '(性的|暴力的)な表現',
          '差別的な内容',
        ],
        severity: 'high',
        action: 'filter',
        isActive: true,
      },
      {
        id: 'personal_info_filter',
        name: '個人情報フィルター',
        description: '個人情報の漏洩を防止',
        category: 'dialogue',
        patterns: [
          '\\d{3}-\\d{4}-\\d{4}', // 電話番号
          '\\b\\d{4}\\s?-\\s?\\d{4}\\s?-\\s?\\d{4}\\s?-\\s?\\d{4}\\b', // クレジットカード
          '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', // メールアドレス
          '〒\\d{3}-\\d{4}', // 郵便番号
        ],
        severity: 'critical',
        action: 'block',
        isActive: true,
      },
      {
        id: 'violence_filter',
        name: '暴力的コンテンツフィルター',
        description: '暴力的な内容を検出',
        category: 'dialogue',
        patterns: [
          '(殺害|暴力|攻撃).*表現',
          '(武器|銃|ナイフ).*使用',
          '血.*描写',
        ],
        severity: 'high',
        action: 'warn',
        isActive: true,
      },
      {
        id: 'age_inappropriate_filter',
        name: '年齢不適切コンテンツフィルター',
        description: '未成年に不適切な内容を検出',
        category: 'dialogue',
        patterns: [
          '成人向け.*内容',
          'アルコール.*飲用',
          'ギャンブル.*関連',
        ],
        severity: 'medium',
        action: 'filter',
        isActive: true,
      },
      {
        id: 'spam_filter',
        name: 'スパムフィルター',
        description: 'スパムや宣伝を検出',
        category: 'dialogue',
        patterns: [
          '(今すぐ|急いで).*クリック',
          '無料.*[0-9]+.*円',
          '限定.*オファー',
          'www\\.[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        ],
        severity: 'medium',
        action: 'filter',
        isActive: true,
      },
    ];
  }

  private initializeGuidelines(): void {
    this.guidelines = {
      general: {
        rating: 'general',
        minAge: 0,
        description: '全年齢対象の健全なコンテンツ',
        allowedTopics: [
          '日常会話',
          '友情',
          '学習',
          '趣味',
          '家族',
          'ペット',
          '食べ物',
          '旅行',
          '音楽',
          'スポーツ',
        ],
        restrictedTopics: [
          '恋愛（過度な表現）',
          '暴力',
          '性的内容',
          '薬物',
          'ギャンブル',
          '政治的議論',
          '宗教的議論',
        ],
        emotionLimits: {
          neutral: 1.0,
          happy: 1.0,
          sad: 0.7,
          angry: 0.3,
          surprised: 1.0,
          embarrassed: 0.8,
        },
        contentLimits: {
          maxMessageLength: 200,
          maxConversationLength: 50,
          allowedLanguages: ['ja-JP'],
        },
      },
      teen: {
        rating: 'teen',
        minAge: 13,
        description: '13歳以上対象のコンテンツ',
        allowedTopics: [
          '恋愛（健全な範囲）',
          '友情',
          '学校生活',
          '将来の夢',
          '軽い悩み相談',
          '趣味',
          'エンターテイメント',
        ],
        restrictedTopics: [
          '過度な性的表現',
          '暴力的内容',
          '薬物使用',
          'ギャンブル',
          '極端な政治的内容',
        ],
        emotionLimits: {
          neutral: 1.0,
          happy: 1.0,
          sad: 1.0,
          angry: 0.6,
          surprised: 1.0,
          embarrassed: 1.0,
        },
        contentLimits: {
          maxMessageLength: 300,
          maxConversationLength: 100,
          allowedLanguages: ['ja-JP', 'en-US'],
        },
      },
      mature: {
        rating: 'mature',
        minAge: 17,
        description: '17歳以上対象のコンテンツ',
        allowedTopics: [
          '恋愛関係',
          '深い感情表現',
          '人生相談',
          '複雑な人間関係',
          '将来への不安',
          '社会問題',
        ],
        restrictedTopics: [
          '露骨な性的表現',
          '極端な暴力',
          '薬物使用推奨',
          '自傷行為',
          '犯罪行為',
        ],
        emotionLimits: {
          neutral: 1.0,
          happy: 1.0,
          sad: 1.0,
          angry: 0.8,
          surprised: 1.0,
          embarrassed: 1.0,
        },
        contentLimits: {
          maxMessageLength: 500,
          maxConversationLength: 200,
          allowedLanguages: ['ja-JP', 'en-US'],
        },
      },
      restricted: {
        rating: 'restricted',
        minAge: 18,
        description: '18歳以上限定コンテンツ',
        allowedTopics: [
          '成人向け恋愛',
          '複雑な感情',
          '深刻な相談',
          '成人の悩み',
          '社会的議論',
        ],
        restrictedTopics: [
          '違法行為',
          '極端な暴力',
          '薬物使用',
          '自傷行為推奨',
          '犯罪教唆',
        ],
        emotionLimits: {
          neutral: 1.0,
          happy: 1.0,
          sad: 1.0,
          angry: 1.0,
          surprised: 1.0,
          embarrassed: 1.0,
        },
        contentLimits: {
          maxMessageLength: 1000,
          maxConversationLength: 500,
          allowedLanguages: ['ja-JP', 'en-US'],
        },
      },
    };
  }

  async initializeUserPreferences(userId: string): Promise<void> {
    try {
      const savedPreferences = await storageService.getUserPreferences();
      if (savedPreferences?.contentPreferences) {
        this.userPreferences.set(userId, savedPreferences.contentPreferences);
      } else {
        // デフォルト設定
        const defaultPreferences: UserContentPreferences = {
          userId,
          contentRating: 'general',
          enabledFilters: this.filters.filter(f => f.isActive).map(f => f.id),
          customFilters: [],
          parentalControls: {
            isEnabled: false,
            allowedCategories: ['dialogue', 'scenario'],
          },
          privacySettings: {
            dataCollection: false,
            analytics: false,
            personalization: true,
            shareUsageData: false,
          },
        };
        this.userPreferences.set(userId, defaultPreferences);
        await this.saveUserPreferences(userId);
      }
    } catch (error) {
      console.error('Failed to initialize user preferences:', error);
    }
  }

  async saveUserPreferences(userId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      try {
        const currentPreferences = await storageService.getUserPreferences();
        await storageService.saveUserPreferences({
          ...currentPreferences,
          contentPreferences: preferences,
        });
      } catch (error) {
        console.error('Failed to save user preferences:', error);
      }
    }
  }

  async scanContent(
    content: string,
    category: ContentCategory,
    userId: string
  ): Promise<ContentScanResult> {
    const startTime = Date.now();
    const userPreferences = this.userPreferences.get(userId);
    
    if (!userPreferences) {
      await this.initializeUserPreferences(userId);
    }

    const preferences = this.userPreferences.get(userId)!;
    const guideline = this.guidelines[preferences.contentRating];
    
    const result: ContentScanResult = {
      isAllowed: true,
      confidence: 1.0,
      rating: preferences.contentRating,
      detectedIssues: [],
      metadata: {
        scanTimestamp: new Date(),
        scanDuration: 0,
        filtersUsed: [],
        contentHash: this.generateContentHash(content),
      },
    };

    // 長さ制限チェック
    if (content.length > guideline.contentLimits.maxMessageLength) {
      result.detectedIssues.push({
        type: 'length_exceeded',
        severity: 'medium',
        description: `メッセージが長すぎます（${content.length}/${guideline.contentLimits.maxMessageLength}文字）`,
        suggestions: ['メッセージを短くしてください'],
      });
      result.confidence *= 0.8;
    }

    // アクティブなフィルターを適用
    const enabledFilters = this.filters.filter(f => 
      f.isActive && 
      f.category === category &&
      preferences.enabledFilters.includes(f.id)
    );

    for (const filter of enabledFilters) {
      result.metadata.filtersUsed.push(filter.id);
      
      for (const pattern of filter.patterns) {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          const issue = {
            type: filter.id,
            severity: filter.severity,
            description: `${filter.name}: ${matches.length}個の一致を検出`,
            location: `位置: ${content.indexOf(matches[0])}`,
            suggestions: this.getSuggestions(filter),
          };
          
          result.detectedIssues.push(issue);
          
          // 重要度に応じて信頼度を調整
          const confidencePenalty = this.getConfidencePenalty(filter.severity);
          result.confidence *= confidencePenalty;
          
          // アクションに応じて処理
          switch (filter.action) {
            case 'block':
              result.isAllowed = false;
              break;
            case 'filter':
              result.filteredContent = this.applyContentFilter(content, regex);
              break;
            case 'warn':
              // 警告のみ、コンテンツは通す
              break;
            case 'report':
              await this.createModerationReport(content, filter, userId);
              break;
          }
        }
      }
    }

    // カスタムフィルターを適用
    for (const customFilter of preferences.customFilters) {
      if (customFilter.category === category && customFilter.isActive) {
        // カスタムフィルターのロジックを適用
        // 実装は基本フィルターと同様
      }
    }

    // 最終的な許可判定
    if (result.confidence < 0.5 || result.detectedIssues.some(i => i.severity === 'critical')) {
      result.isAllowed = false;
    }

    result.metadata.scanDuration = Date.now() - startTime;
    
    return result;
  }

  async validateContentRating(
    content: string,
    requestedRating: ContentRating,
    userId: string
  ): Promise<{isValid: boolean; suggestedRating: ContentRating; reasons: string[]}> {
    const scanResult = await this.scanContent(content, 'dialogue', userId);
    const guideline = this.guidelines[requestedRating];
    const reasons: string[] = [];
    
    let isValid = true;
    let suggestedRating = requestedRating;

    // 検出された問題を分析
    for (const issue of scanResult.detectedIssues) {
      if (issue.severity === 'critical' && requestedRating !== 'restricted') {
        isValid = false;
        suggestedRating = 'restricted';
        reasons.push(`重大な問題が検出されました: ${issue.description}`);
      } else if (issue.severity === 'high' && ['general', 'teen'].includes(requestedRating)) {
        isValid = false;
        suggestedRating = requestedRating === 'general' ? 'teen' : 'mature';
        reasons.push(`高リスクな内容が検出されました: ${issue.description}`);
      }
    }

    // 感情強度チェック
    // この部分は実際の感情分析結果を使用
    const detectedEmotions = await this.analyzeEmotions(content);
    for (const [emotion, intensity] of Object.entries(detectedEmotions)) {
      const limit = guideline.emotionLimits[emotion as EmotionType];
      if (intensity > limit) {
        isValid = false;
        reasons.push(`感情表現が強すぎます: ${emotion} (${intensity} > ${limit})`);
      }
    }

    return {isValid, suggestedRating, reasons};
  }

  async updateUserContentPreferences(
    userId: string,
    updates: Partial<UserContentPreferences>
  ): Promise<void> {
    const currentPreferences = this.userPreferences.get(userId);
    if (currentPreferences) {
      const updatedPreferences = {...currentPreferences, ...updates};
      this.userPreferences.set(userId, updatedPreferences);
      await this.saveUserPreferences(userId);
    }
  }

  async addCustomFilter(userId: string, filter: ContentFilter): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      preferences.customFilters.push(filter);
      await this.saveUserPreferences(userId);
    }
  }

  async removeCustomFilter(userId: string, filterId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      preferences.customFilters = preferences.customFilters.filter(f => f.id !== filterId);
      await this.saveUserPreferences(userId);
    }
  }

  async getContentGuidelines(rating: ContentRating): Promise<ContentRatingGuideline> {
    return this.guidelines[rating];
  }

  async getUserContentPreferences(userId: string): Promise<UserContentPreferences | null> {
    return this.userPreferences.get(userId) || null;
  }

  async getAvailableFilters(): Promise<ContentFilter[]> {
    return [...this.filters];
  }

  private generateContentHash(content: string): string {
    // 簡単なハッシュ生成（実際の実装ではより安全な方法を使用）
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash).toString(36);
  }

  private getConfidencePenalty(severity: string): number {
    switch (severity) {
      case 'critical': return 0.1;
      case 'high': return 0.3;
      case 'medium': return 0.6;
      case 'low': return 0.8;
      default: return 0.9;
    }
  }

  private getSuggestions(filter: ContentFilter): string[] {
    const suggestions: Record<string, string[]> = {
      profanity_filter: [
        '言葉遣いを見直してください',
        'より丁寧な表現を使用してください',
      ],
      personal_info_filter: [
        '個人情報を含めないでください',
        'プライバシーを保護してください',
      ],
      violence_filter: [
        '暴力的な表現を避けてください',
        'より平和的な内容にしてください',
      ],
      age_inappropriate_filter: [
        '年齢に適した内容にしてください',
        'より健全な話題を選んでください',
      ],
      spam_filter: [
        '宣伝的な内容を削除してください',
        'より自然な会話にしてください',
      ],
    };
    
    return suggestions[filter.id] || ['内容を見直してください'];
  }

  private applyContentFilter(content: string, pattern: RegExp): string {
    return content.replace(pattern, (match) => {
      // マッチした部分を隠す（実際の実装では適切な置換を行う）
      return '*'.repeat(match.length);
    });
  }

  private async createModerationReport(
    content: string,
    filter: ContentFilter,
    userId: string
  ): Promise<void> {
    const report: ContentModerationReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: this.generateContentHash(content),
      contentType: filter.category,
      reportedBy: 'system',
      reportReason: `自動検出: ${filter.name}`,
      reportTimestamp: new Date(),
      status: 'pending',
    };

    // レポートを保存（実際の実装では適切なストレージに保存）
    console.warn('Content moderation report created:', report);
  }

  private async analyzeEmotions(content: string): Promise<Record<EmotionType, number>> {
    // 簡単な感情分析（実際の実装では高度なNLP処理を使用）
    const emotions: Record<EmotionType, number> = {
      neutral: 0.5,
      happy: 0.0,
      sad: 0.0,
      angry: 0.0,
      surprised: 0.0,
      embarrassed: 0.0,
    };

    // キーワードベースの簡単な分析
    const happyWords = ['嬉しい', '楽しい', '幸せ', '良い', '素晴らしい'];
    const sadWords = ['悲しい', '辛い', '寂しい', '落ち込む', '憂鬱'];
    const angryWords = ['怒り', '腹立つ', 'ムカつく', 'イライラ', '憤り'];
    const surprisedWords = ['驚き', 'びっくり', '衝撃', '意外', '想定外'];
    const embarrassedWords = ['恥ずかしい', '照れる', '赤面', '気まずい'];

    const lowerContent = content.toLowerCase();
    
    happyWords.forEach(word => {
      if (lowerContent.includes(word)) emotions.happy += 0.2;
    });
    
    sadWords.forEach(word => {
      if (lowerContent.includes(word)) emotions.sad += 0.2;
    });
    
    angryWords.forEach(word => {
      if (lowerContent.includes(word)) emotions.angry += 0.2;
    });
    
    surprisedWords.forEach(word => {
      if (lowerContent.includes(word)) emotions.surprised += 0.2;
    });
    
    embarrassedWords.forEach(word => {
      if (lowerContent.includes(word)) emotions.embarrassed += 0.2;
    });

    // 正規化
    const maxEmotion = Math.max(...Object.values(emotions));
    if (maxEmotion > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key as EmotionType] = Math.min(1.0, emotions[key as EmotionType]);
      });
    }

    return emotions;
  }
}

export const contentFilterService = new ContentFilterService();
export default contentFilterService;