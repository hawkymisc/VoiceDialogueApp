import {contentFilterService} from '../contentFilterService';
import {storageService} from '../storageService';
import {ContentRating, ContentCategory} from '../../types/ContentSecurity';

// Mock storageService
jest.mock('../storageService');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

describe('ContentFilterService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.getUserPreferences.mockResolvedValue({});
    mockStorageService.saveUserPreferences.mockResolvedValue();
  });

  describe('initializeUserPreferences', () => {
    it('should initialize user preferences with default values', async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences).toBeDefined();
      expect(preferences?.contentRating).toBe('general');
      expect(preferences?.privacySettings.dataCollection).toBe(false);
    });

    it('should load existing preferences from storage', async () => {
      const existingPreferences = {
        contentPreferences: {
          userId: mockUserId,
          contentRating: 'teen' as ContentRating,
          enabledFilters: ['profanity_filter'],
          customFilters: [],
          parentalControls: {isEnabled: false, allowedCategories: ['dialogue']},
          privacySettings: {
            dataCollection: true,
            analytics: false,
            personalization: true,
            shareUsageData: false,
          },
        },
      };

      mockStorageService.getUserPreferences.mockResolvedValue(existingPreferences);

      await contentFilterService.initializeUserPreferences(mockUserId);

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.contentRating).toBe('teen');
      expect(preferences?.privacySettings.dataCollection).toBe(true);
    });
  });

  describe('scanContent', () => {
    beforeEach(async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);
    });

    it('should allow clean content', async () => {
      const cleanContent = 'こんにちは、今日はいい天気ですね！';
      
      const result = await contentFilterService.scanContent(
        cleanContent,
        'dialogue',
        mockUserId
      );

      expect(result.isAllowed).toBe(true);
      expect(result.detectedIssues).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect inappropriate content', async () => {
      const inappropriateContent = '不適切語1を含むメッセージです';
      
      const result = await contentFilterService.scanContent(
        inappropriateContent,
        'dialogue',
        mockUserId
      );

      expect(result.detectedIssues.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should detect personal information', async () => {
      const personalInfoContent = '私の電話番号は090-1234-5678です';
      
      const result = await contentFilterService.scanContent(
        personalInfoContent,
        'dialogue',
        mockUserId
      );

      expect(result.detectedIssues.length).toBeGreaterThan(0);
      expect(result.detectedIssues[0].severity).toBe('critical');
      expect(result.isAllowed).toBe(false);
    });

    it('should respect content rating limits', async () => {
      const longMessage = 'a'.repeat(300); // Exceeds general rating limit
      
      const result = await contentFilterService.scanContent(
        longMessage,
        'dialogue',
        mockUserId
      );

      expect(result.detectedIssues.some(issue => issue.type === 'length_exceeded')).toBe(true);
    });

    it('should filter content when action is filter', async () => {
      const spamContent = '今すぐクリックして無料で1000円ゲット！';
      
      const result = await contentFilterService.scanContent(
        spamContent,
        'dialogue',
        mockUserId
      );

      expect(result.filteredContent).toBeDefined();
      expect(result.filteredContent).not.toBe(spamContent);
    });
  });

  describe('validateContentRating', () => {
    beforeEach(async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);
    });

    it('should validate content against requested rating', async () => {
      const mildContent = 'こんにちは、今日は楽しい一日でした！';
      
      const result = await contentFilterService.validateContentRating(
        mildContent,
        'general',
        mockUserId
      );

      expect(result.isValid).toBe(true);
      expect(result.suggestedRating).toBe('general');
    });

    it('should suggest higher rating for inappropriate content', async () => {
      const matureContent = '成人向けな内容を含むメッセージ';
      
      const result = await contentFilterService.validateContentRating(
        matureContent,
        'general',
        mockUserId
      );

      expect(result.isValid).toBe(false);
      expect(result.suggestedRating).not.toBe('general');
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('updateUserContentPreferences', () => {
    beforeEach(async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);
    });

    it('should update user content preferences', async () => {
      await contentFilterService.updateUserContentPreferences(mockUserId, {
        contentRating: 'teen',
      });

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.contentRating).toBe('teen');
      expect(mockStorageService.saveUserPreferences).toHaveBeenCalled();
    });

    it('should update privacy settings', async () => {
      await contentFilterService.updateUserContentPreferences(mockUserId, {
        privacySettings: {
          dataCollection: true,
          analytics: true,
          personalization: false,
          shareUsageData: false,
        },
      });

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.privacySettings.dataCollection).toBe(true);
      expect(preferences?.privacySettings.analytics).toBe(true);
    });
  });

  describe('customFilters', () => {
    beforeEach(async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);
    });

    it('should add custom filter', async () => {
      const customFilter = {
        id: 'custom_test_filter',
        name: 'テストフィルター',
        description: 'テスト用のカスタムフィルター',
        category: 'dialogue' as ContentCategory,
        patterns: ['テストパターン'],
        severity: 'medium' as const,
        action: 'warn' as const,
        isActive: true,
      };

      await contentFilterService.addCustomFilter(mockUserId, customFilter);

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.customFilters).toContain(customFilter);
    });

    it('should remove custom filter', async () => {
      const customFilter = {
        id: 'custom_test_filter',
        name: 'テストフィルター',
        description: 'テスト用のカスタムフィルター',
        category: 'dialogue' as ContentCategory,
        patterns: ['テストパターン'],
        severity: 'medium' as const,
        action: 'warn' as const,
        isActive: true,
      };

      await contentFilterService.addCustomFilter(mockUserId, customFilter);
      await contentFilterService.removeCustomFilter(mockUserId, customFilter.id);

      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.customFilters).not.toContain(customFilter);
    });
  });

  describe('getContentGuidelines', () => {
    it('should return guidelines for general rating', async () => {
      const guidelines = await contentFilterService.getContentGuidelines('general');
      
      expect(guidelines.rating).toBe('general');
      expect(guidelines.minAge).toBe(0);
      expect(guidelines.allowedTopics).toContain('日常会話');
      expect(guidelines.restrictedTopics).toContain('暴力');
    });

    it('should return guidelines for teen rating', async () => {
      const guidelines = await contentFilterService.getContentGuidelines('teen');
      
      expect(guidelines.rating).toBe('teen');
      expect(guidelines.minAge).toBe(13);
      expect(guidelines.allowedTopics).toContain('恋愛（健全な範囲）');
    });

    it('should return guidelines for mature rating', async () => {
      const guidelines = await contentFilterService.getContentGuidelines('mature');
      
      expect(guidelines.rating).toBe('mature');
      expect(guidelines.minAge).toBe(17);
      expect(guidelines.contentLimits.maxMessageLength).toBe(500);
    });

    it('should return guidelines for restricted rating', async () => {
      const guidelines = await contentFilterService.getContentGuidelines('restricted');
      
      expect(guidelines.rating).toBe('restricted');
      expect(guidelines.minAge).toBe(18);
      expect(guidelines.contentLimits.maxMessageLength).toBe(1000);
    });
  });

  describe('getAvailableFilters', () => {
    it('should return all available filters', async () => {
      const filters = await contentFilterService.getAvailableFilters();
      
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.some(f => f.id === 'profanity_filter')).toBe(true);
      expect(filters.some(f => f.id === 'personal_info_filter')).toBe(true);
      expect(filters.some(f => f.id === 'violence_filter')).toBe(true);
    });

    it('should include filter properties', async () => {
      const filters = await contentFilterService.getAvailableFilters();
      const profanityFilter = filters.find(f => f.id === 'profanity_filter');
      
      expect(profanityFilter).toBeDefined();
      expect(profanityFilter?.name).toBe('不適切な言葉フィルター');
      expect(profanityFilter?.category).toBe('dialogue');
      expect(profanityFilter?.severity).toBe('high');
      expect(profanityFilter?.action).toBe('filter');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorageService.getUserPreferences.mockRejectedValue(new Error('Storage error'));

      await expect(
        contentFilterService.initializeUserPreferences(mockUserId)
      ).resolves.not.toThrow();

      // Should still create default preferences
      const preferences = await contentFilterService.getUserContentPreferences(mockUserId);
      expect(preferences?.contentRating).toBe('general');
    });

    it('should handle scan errors gracefully', async () => {
      await contentFilterService.initializeUserPreferences(mockUserId);

      // Test with null/undefined content
      const result = await contentFilterService.scanContent('', 'dialogue', mockUserId);
      expect(result.isAllowed).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should perform end-to-end content filtering workflow', async () => {
      // Initialize preferences
      await contentFilterService.initializeUserPreferences(mockUserId);

      // Update to teen rating
      await contentFilterService.updateUserContentPreferences(mockUserId, {
        contentRating: 'teen',
      });

      // Scan content that should be allowed for teen
      const teenContent = '学校での友達との楽しい会話';
      const result = await contentFilterService.scanContent(
        teenContent,
        'dialogue',
        mockUserId
      );

      expect(result.isAllowed).toBe(true);
      expect(result.rating).toBe('teen');

      // Validate content rating
      const validation = await contentFilterService.validateContentRating(
        teenContent,
        'teen',
        mockUserId
      );

      expect(validation.isValid).toBe(true);
    });
  });
});