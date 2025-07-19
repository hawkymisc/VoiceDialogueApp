import {openaiService} from '../../services/openaiService';
import {dailyContentService} from '../../services/dailyContentService';
import {progressionService} from '../../services/progressionService';
import {contentFilterService} from '../../services/contentFilterService';
import {securityService} from '../../services/securityService';
import {conversationService} from '../../services/conversationService';
import {scenarioService} from '../../services/scenarioService';
import {storageService} from '../../services/storageService';

// Mock external dependencies
jest.mock('../../services/storageService');

const mockStorageService = storageService as jest.Mocked<typeof storageService>;

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Full System Integration Tests', () => {
  const testUserId = 'integration-test-user';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage service
    mockStorageService.get.mockResolvedValue(null);
    mockStorageService.save.mockResolvedValue();
    mockStorageService.remove.mockResolvedValue();
    mockStorageService.clear.mockResolvedValue();

    // Mock OpenAI API
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'おはようございます！今日も一緒に素敵な時間を過ごしましょうね。',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 30,
          total_tokens: 130,
        },
      }),
    } as Response);
  });

  describe('Complete User Journey Integration', () => {
    it('should handle complete conversation flow with security and progression', async () => {
      // Initialize all services
      await contentFilterService.initialize();
      await securityService.initialize();
      await progressionService.initialize();
      await dailyContentService.initialize();

      // 1. User starts conversation
      const userMessage = 'おはよう！今日はどんな一日にしようか？';
      
      // 2. Content filtering
      const filterResult = await contentFilterService.scanContent(userMessage, {
        userId: testUserId,
        characterId: 'aoi',
        scenarioId: 'daily_morning',
      });
      
      expect(filterResult.isApproved).toBe(true);

      // 3. Generate AI response
      const dialogueResponse = await openaiService.generateDialogue({
        userId: testUserId,
        userMessage,
        characterId: 'aoi',
        personality: {
          aggressiveness: 20,
          kindness: 90,
          tsundere_level: 30,
          shyness: 60,
        },
        conversationContext: {
          character_id: 'aoi',
          scenario_id: 'daily_morning',
          conversation_history: [],
          current_emotion: 'neutral',
          relationship_level: 'friend',
          time_of_day: 'morning',
          location: 'home',
          previous_topics: [],
        },
        scenarioId: 'daily_morning',
      });

      expect(dialogueResponse.message).toBeTruthy();
      expect(dialogueResponse.isFiltered).toBe(false);

      // 4. Save conversation
      const conversationId = await conversationService.saveConversation({
        userId: testUserId,
        characterId: 'aoi',
        scenarioId: 'daily_morning',
        userMessage,
        characterResponse: dialogueResponse.message,
        emotion: dialogueResponse.emotion,
        timestamp: new Date(),
      });

      expect(conversationId).toBeTruthy();

      // 5. Update user progress
      const userProgress = await progressionService.getUserProgress(testUserId);
      const updatedProgress = await progressionService.updateUserProgress(testUserId, {
        ...userProgress,
        characterAffinities: {
          ...userProgress.characterAffinities,
          aoi: {
            ...userProgress.characterAffinities.aoi,
            conversationCount: userProgress.characterAffinities.aoi.conversationCount + 1,
            timeSpent: userProgress.characterAffinities.aoi.timeSpent + 5,
          },
        },
      });

      expect(updatedProgress.characterAffinities.aoi.conversationCount).toBeGreaterThan(0);

      // 6. Log security event
      await securityService.logSecurityEvent(testUserId, {
        eventType: 'conversation_completed',
        details: {
          characterId: 'aoi',
          scenarioId: 'daily_morning',
          conversationId,
        },
        riskLevel: 'low',
      });

      // Verify the complete flow worked
      expect(mockStorageService.save).toHaveBeenCalledWith(
        expect.stringContaining('conversation'),
        expect.any(Object)
      );
    });

    it('should handle daily content generation and completion flow', async () => {
      // Initialize services
      await dailyContentService.initialize();
      await progressionService.initialize();

      // 1. Generate daily content
      const today = new Date();
      const dailyContent = await dailyContentService.generateDailyContent(today, testUserId);
      
      expect(dailyContent).toHaveLength(1);
      expect(dailyContent[0].isCompleted).toBe(false);

      // 2. User completes content
      const completionSuccess = await dailyContentService.completeContent(
        dailyContent[0].id,
        testUserId
      );
      
      expect(completionSuccess).toBe(true);

      // 3. Check for achievement/milestone progress
      const userProgress = await progressionService.getUserProgress(testUserId);
      const earnedAchievements = await progressionService.checkAchievements(testUserId, userProgress);
      
      expect(earnedAchievements).toBeDefined();
    });

    it('should handle special event participation flow', async () => {
      // Mock Valentine's Day
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-14'));

      await dailyContentService.initialize();

      // 1. Check for active special events
      const specialEvents = await dailyContentService.getActiveSpecialEvents(new Date());
      
      expect(specialEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'valentine_day',
            isActive: true,
          }),
        ])
      );

      // 2. Participate in special event (simulate user interaction)
      const valentineEvent = specialEvents.find(e => e.id === 'valentine_day');
      if (valentineEvent) {
        // Update user progress with event participation
        const userProgress = await progressionService.getUserProgress(testUserId);
        await progressionService.updateUserProgress(testUserId, {
          ...userProgress,
          participatedEvents: [...userProgress.participatedEvents, 'valentine_day'],
        });
      }

      jest.useRealTimers();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle service failures gracefully in conversation flow', async () => {
      await contentFilterService.initialize();

      // Simulate OpenAI service failure
      mockFetch.mockRejectedValueOnce(new Error('OpenAI service unavailable'));

      const dialogueResponse = await openaiService.generateDialogue({
        userId: testUserId,
        userMessage: 'テストメッセージ',
        characterId: 'aoi',
        personality: {
          aggressiveness: 20,
          kindness: 90,
          tsundere_level: 30,
          shyness: 60,
        },
        conversationContext: {
          character_id: 'aoi',
          scenario_id: 'daily_morning',
          conversation_history: [],
          current_emotion: 'neutral',
          relationship_level: 'friend',
          time_of_day: 'morning',
          location: 'home',
          previous_topics: [],
        },
        scenarioId: 'daily_morning',
      });

      // Should return error response but not crash
      expect(dialogueResponse.error).toBeDefined();
      expect(dialogueResponse.message).toContain('申し訳ございません');
    });

    it('should handle storage failures in progression system', async () => {
      await progressionService.initialize();

      // Simulate storage failure
      mockStorageService.save.mockRejectedValueOnce(new Error('Storage unavailable'));

      await expect(
        progressionService.updateUserProgress(testUserId, {level: 2})
      ).rejects.toThrow();

      // System should recover for subsequent operations
      mockStorageService.save.mockResolvedValueOnce(undefined);
      
      const userProgress = await progressionService.getUserProgress(testUserId);
      expect(userProgress).toBeDefined();
    });

    it('should handle content filter service failures', async () => {
      // Simulate filter service failure
      jest.spyOn(contentFilterService, 'scanContent').mockRejectedValueOnce(
        new Error('Filter service error')
      );

      // OpenAI service should still work with fallback
      const dialogueResponse = await openaiService.generateDialogue({
        userId: testUserId,
        userMessage: 'テストメッセージ',
        characterId: 'aoi',
        personality: {
          aggressiveness: 20,
          kindness: 90,
          tsundere_level: 30,
          shyness: 60,
        },
        conversationContext: {
          character_id: 'aoi',
          scenario_id: 'daily_morning',
          conversation_history: [],
          current_emotion: 'neutral',
          relationship_level: 'friend',
          time_of_day: 'morning',
          location: 'home',
          previous_topics: [],
        },
        scenarioId: 'daily_morning',
      });

      expect(dialogueResponse.message).toBeTruthy();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent user operations efficiently', async () => {
      await Promise.all([
        contentFilterService.initialize(),
        securityService.initialize(),
        progressionService.initialize(),
        dailyContentService.initialize(),
      ]);

      const userIds = Array(5).fill(null).map((_, i) => `user-${i}`);
      
      const concurrentOperations = userIds.map(async (userId) => {
        // Simulate multiple operations per user
        const operations = [
          dailyContentService.generateDailyContent(new Date(), userId),
          progressionService.getUserProgress(userId),
          contentFilterService.scanContent('テストメッセージ', {
            userId,
            characterId: 'aoi',
            scenarioId: 'daily_morning',
          }),
        ];

        return Promise.all(operations);
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const processingTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large conversation history efficiently', async () => {
      await conversationService.initialize();

      // Create large conversation history
      const conversations = Array(100).fill(null).map((_, index) => ({
        id: `conv-${index}`,
        userId: testUserId,
        characterId: 'aoi' as const,
        scenarioId: 'daily_morning',
        userMessage: `メッセージ ${index}`,
        characterResponse: `応答 ${index}`,
        emotion: 'neutral' as const,
        timestamp: new Date(Date.now() - index * 60000), // 1 minute apart
        scenario_context: {
          location: 'home',
          time_of_day: 'morning',
          weather: 'sunny',
          relationship_context: 'friendly',
        },
      }));

      for (const conversation of conversations) {
        await conversationService.saveConversation(conversation);
      }

      const startTime = Date.now();
      const history = await conversationService.getConversationHistory(testUserId, {
        limit: 50,
        characterId: 'aoi',
      });
      const queryTime = Date.now() - startTime;

      expect(history).toHaveLength(50);
      expect(queryTime).toBeLessThan(1000); // Should be fast even with large dataset
    });
  });

  describe('Data Consistency Across Services', () => {
    it('should maintain user progress consistency across services', async () => {
      await Promise.all([
        progressionService.initialize(),
        dailyContentService.initialize(),
        conversationService.initialize(),
      ]);

      // Create user progress
      const initialProgress = await progressionService.getUserProgress(testUserId);
      
      // Update through conversation service
      await conversationService.saveConversation({
        userId: testUserId,
        characterId: 'aoi',
        scenarioId: 'daily_morning',
        userMessage: 'テスト',
        characterResponse: 'テスト応答',
        emotion: 'happy',
        timestamp: new Date(),
      });

      // Update through daily content service
      const dailyContent = await dailyContentService.generateDailyContent(new Date(), testUserId);
      await dailyContentService.completeContent(dailyContent[0].id, testUserId);

      // Verify consistency
      const finalProgress = await progressionService.getUserProgress(testUserId);
      expect(finalProgress.userId).toBe(testUserId);
      expect(finalProgress.level).toBeGreaterThanOrEqual(initialProgress.level);
    });

    it('should handle concurrent updates to user data safely', async () => {
      await progressionService.initialize();

      const initialProgress = await progressionService.getUserProgress(testUserId);
      
      // Simulate concurrent updates
      const updates = [
        progressionService.updateUserProgress(testUserId, {
          totalExperience: initialProgress.totalExperience + 100,
        }),
        progressionService.updateUserProgress(testUserId, {
          characterAffinities: {
            ...initialProgress.characterAffinities,
            aoi: {
              ...initialProgress.characterAffinities.aoi,
              level: initialProgress.characterAffinities.aoi.level + 1,
            },
          },
        }),
      ];

      const results = await Promise.all(updates);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.userId === testUserId)).toBe(true);
    });
  });

  describe('Security Integration Across Services', () => {
    it('should maintain security controls across all user interactions', async () => {
      await Promise.all([
        securityService.initialize(),
        contentFilterService.initialize(),
        progressionService.initialize(),
      ]);

      // 1. Content filtering for user input
      const userMessage = 'セキュリティテストメッセージ';
      const filterResult = await contentFilterService.scanContent(userMessage, {
        userId: testUserId,
        characterId: 'aoi',
        scenarioId: 'daily_morning',
      });

      // 2. Log security event
      await securityService.logSecurityEvent(testUserId, {
        eventType: 'content_filtered',
        details: {filterResult},
        riskLevel: 'low',
      });

      // 3. Encrypt sensitive data
      const sensitiveData = {userMessage, timestamp: new Date()};
      const encrypted = await securityService.encryptData(
        JSON.stringify(sensitiveData),
        testUserId
      );

      // 4. Verify audit trail
      const auditLogs = await securityService.getAuditLogs(testUserId, {
        startDate: new Date(Date.now() - 60000),
        endDate: new Date(),
      });

      expect(filterResult.isApproved).toBe(true);
      expect(encrypted).toBeTruthy();
      expect(auditLogs).toHaveLength(1);
    });

    it('should handle privacy settings across all services', async () => {
      await securityService.initialize();

      // Set privacy settings
      const privacySettings = {
        dataCollection: 'minimal' as const,
        analyticsEnabled: false,
        personalizedContent: true,
        thirdPartySharing: false,
        dataRetentionPeriod: 30,
        cookiePreferences: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: true,
        },
      };

      await securityService.updatePrivacySettings(testUserId, privacySettings);

      // Verify settings are applied
      const retrievedSettings = await securityService.getPrivacySettings(testUserId);
      expect(retrievedSettings).toEqual(privacySettings);

      // Test data retention compliance
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      
      // This would trigger data cleanup based on retention period
      // In a real implementation, this would be handled by a background job
    });
  });

  describe('Service Initialization and Cleanup', () => {
    it('should initialize all services without conflicts', async () => {
      const services = [
        contentFilterService.initialize(),
        securityService.initialize(),
        progressionService.initialize(),
        dailyContentService.initialize(),
      ];

      await expect(Promise.all(services)).resolves.not.toThrow();
    });

    it('should handle service initialization failures gracefully', async () => {
      // Mock storage failure during initialization
      mockStorageService.get.mockRejectedValueOnce(new Error('Storage init failed'));

      // Some services should still initialize successfully
      await expect(contentFilterService.initialize()).resolves.not.toThrow();
      
      // Reset mock for other services
      mockStorageService.get.mockResolvedValue(null);
      await expect(progressionService.initialize()).rejects.toThrow();
    });
  });
});