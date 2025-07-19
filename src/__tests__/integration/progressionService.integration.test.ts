import {progressionService} from '../../services/progressionService';
import {storageService} from '../../services/storageService';
import {UserProgress, Achievement, WeeklyGoal, ProgressionMilestone} from '../../types/Engagement';

// Mock dependencies
jest.mock('../../services/storageService', () => ({
  storageService: {
    saveUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    saveUserPreferences: jest.fn(),
    getUserPreferences: jest.fn(),
    saveFavoriteConversations: jest.fn(),
    getFavoriteConversations: jest.fn(),
    saveUnlockedContent: jest.fn(),
    getUnlockedContent: jest.fn(),
    clearAllData: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
  },
}));

const mockStorageService = require('../../services/storageService').storageService;

describe('ProgressionService Integration Tests', () => {
  const testUserId = 'test-user-123';
  
  const mockUserProgress: UserProgress = {
    userId: testUserId,
    level: 5,
    totalExperience: 1200,
    characterAffinities: {
      aoi: {
        level: 25,
        experience: 600,
        timeSpent: 180,
        conversationCount: 15,
        lastInteraction: new Date('2024-07-15'),
      },
      shun: {
        level: 30,
        experience: 800,
        timeSpent: 240,
        conversationCount: 20,
        lastInteraction: new Date('2024-07-16'),
      },
    },
    completedDailyContent: ['daily_morning', 'daily_weather', 'tutorial_conversation'],
    participatedEvents: ['valentine_day'],
    unlockedMoments: ['aoi_childhood_memory'],
    achievements: [],
    streakData: {
      currentStreak: 8,
      longestStreak: 12,
      lastActiveDate: new Date('2024-07-16'),
    },
    weeklyGoals: [],
    preferences: {
      preferredTimeSlots: [{startTime: '19:00', endTime: '21:00', days: [1, 2, 3, 4, 5]}],
      notificationSettings: {
        dailyReminder: true,
        newContent: true,
        achievements: true,
        events: true,
        characterMoments: true,
        weeklyGoals: true,
      },
      preferredContentTypes: ['daily', 'romance'],
      difficultyPreference: 'medium',
      sessionDurationPreference: 15,
      autoProgressUnlock: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage service
    mockStorageService.get.mockResolvedValue(mockUserProgress);
    mockStorageService.save.mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(progressionService.initialize()).resolves.not.toThrow();
    });

    it('should load achievements and milestones on initialization', async () => {
      await progressionService.initialize();
      
      const achievements = progressionService.getAllAchievements();
      const milestones = progressionService.getAllMilestones();
      
      expect(achievements.length).toBeGreaterThan(0);
      expect(milestones.length).toBeGreaterThan(0);
    });

    it('should handle initialization errors gracefully', async () => {
      mockStorageService.get.mockRejectedValue(new Error('Storage error'));
      
      await expect(progressionService.initialize()).rejects.toThrow('Progression service initialization failed');
    });
  });

  describe('Achievement System', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should check and update achievement progress', async () => {
      const updatedProgress = await progressionService.updateUserProgress(testUserId, {
        ...mockUserProgress,
        characterAffinities: {
          ...mockUserProgress.characterAffinities,
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            conversationCount: 1, // Should trigger first conversation achievement
          },
        },
      });

      expect(updatedProgress).toBeDefined();
      expect(mockStorageService.save).toHaveBeenCalledWith(
        `user_progress_${testUserId}`,
        expect.any(Object)
      );
    });

    it('should calculate conversation count achievement progress correctly', async () => {
      const achievements = progressionService.getAllAchievements();
      const firstConversationAchievement = achievements.find(a => a.id === 'first_conversation');
      
      expect(firstConversationAchievement).toBeDefined();
      expect(firstConversationAchievement?.conditions.metric).toBe('conversation_count');
      expect(firstConversationAchievement?.conditions.target).toBe(1);
    });

    it('should handle daily streak achievements', async () => {
      const streakProgress = await progressionService.updateUserProgress(testUserId, {
        ...mockUserProgress,
        streakData: {
          currentStreak: 7,
          longestStreak: 12,
          lastActiveDate: new Date(),
        },
      });

      expect(streakProgress.streakData.currentStreak).toBe(7);
    });

    it('should handle character affinity achievements', async () => {
      const affinityProgress = await progressionService.updateUserProgress(testUserId, {
        ...mockUserProgress,
        characterAffinities: {
          ...mockUserProgress.characterAffinities,
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            level: 50, // Should trigger character affinity achievement
          },
        },
      });

      expect(affinityProgress.characterAffinities.aoi.level).toBe(50);
    });

    it('should not duplicate earned achievements', async () => {
      // Mark an achievement as earned
      const achievements = progressionService.getAllAchievements();
      const firstAchievement = achievements[0];
      firstAchievement.isEarned = true;
      firstAchievement.earnedAt = new Date();

      const earnedAchievements = await progressionService.checkAchievements(testUserId, mockUserProgress);
      
      expect(earnedAchievements).not.toContainEqual(
        expect.objectContaining({id: firstAchievement.id})
      );
    });

    it('should handle hidden achievements correctly', async () => {
      const achievements = progressionService.getAllAchievements();
      const hiddenAchievement = achievements.find(a => a.isHidden);
      
      expect(hiddenAchievement).toBeDefined();
      expect(hiddenAchievement?.type).toBe('hidden');
    });
  });

  describe('Milestone System', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should check milestone requirements correctly', async () => {
      // Update progress to meet beginner milestone requirements
      const progressWithTutorial = {
        ...mockUserProgress,
        completedDailyContent: [...mockUserProgress.completedDailyContent, 'tutorial_conversation'],
      };

      const unlockedMilestones = await progressionService.checkMilestones(testUserId, progressWithTutorial);
      
      expect(unlockedMilestones).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'beginner_milestone',
            isUnlocked: true,
          }),
        ])
      );
    });

    it('should handle character affinity milestone requirements', async () => {
      const progressWithHighAffinity = {
        ...mockUserProgress,
        characterAffinities: {
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            level: 25,
          },
          shun: {
            ...mockUserProgress.characterAffinities.shun,
            level: 25,
          },
        },
      };

      const unlockedMilestones = await progressionService.checkMilestones(testUserId, progressWithHighAffinity);
      
      expect(unlockedMilestones).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'friendship_milestone',
          }),
        ])
      );
    });

    it('should handle time-based milestone requirements', async () => {
      const progressWithHighTime = {
        ...mockUserProgress,
        characterAffinities: {
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            timeSpent: 3000,
          },
          shun: {
            ...mockUserProgress.characterAffinities.shun,
            timeSpent: 3000,
          },
        },
      };

      const unlockedMilestones = await progressionService.checkMilestones(testUserId, progressWithHighTime);
      
      expect(unlockedMilestones).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'time_master_milestone',
          }),
        ])
      );
    });

    it('should not unlock milestones when requirements are not met', async () => {
      const lowProgress = {
        ...mockUserProgress,
        level: 1,
        characterAffinities: {
          aoi: {
            level: 1,
            experience: 0,
            timeSpent: 10,
            conversationCount: 1,
            lastInteraction: new Date(),
          },
          shun: {
            level: 1,
            experience: 0,
            timeSpent: 10,
            conversationCount: 1,
            lastInteraction: new Date(),
          },
        },
        completedDailyContent: [],
      };

      const unlockedMilestones = await progressionService.checkMilestones(testUserId, lowProgress);
      
      expect(unlockedMilestones).toHaveLength(0);
    });
  });

  describe('Weekly Goals System', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should generate weekly goals for user', async () => {
      const goals = await progressionService.generateWeeklyGoals(testUserId);
      
      expect(goals).toHaveLength(3);
      expect(goals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'conversation_count',
            target: 15,
          }),
          expect.objectContaining({
            type: 'character_affinity',
            target: 50,
          }),
          expect.objectContaining({
            type: 'time_spent',
            target: 120,
          }),
        ])
      );
    });

    it('should set current progress for goals based on user progress', async () => {
      const goals = await progressionService.generateWeeklyGoals(testUserId);
      const affinityGoal = goals.find(g => g.type === 'character_affinity');
      
      expect(affinityGoal?.current).toBe(30); // Max of aoi (25) and shun (30)
    });

    it('should generate unique goal IDs for different weeks', async () => {
      const goals1 = await progressionService.generateWeeklyGoals(testUserId);
      
      // Mock different week
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-07-22')); // Next week
      
      const goals2 = await progressionService.generateWeeklyGoals(testUserId);
      
      expect(goals1[0].id).not.toBe(goals2[0].id);
      expect(goals1[0].week).not.toBe(goals2[0].week);
      
      jest.useRealTimers();
    });
  });

  describe('Analytics System', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should generate engagement analytics for user', async () => {
      const analytics = await progressionService.generateEngagementAnalytics(testUserId, 'weekly');
      
      expect(analytics).toMatchObject({
        userId: testUserId,
        period: 'weekly',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        metrics: expect.objectContaining({
          sessionCount: expect.any(Number),
          totalTime: expect.any(Number),
          conversationCount: expect.any(Number),
          engagementScore: expect.any(Number),
        }),
        trends: expect.any(Array),
        recommendations: expect.any(Array),
      });
    });

    it('should calculate metrics from user progress', async () => {
      const analytics = await progressionService.generateEngagementAnalytics(testUserId);
      
      expect(analytics.metrics.conversationCount).toBe(35); // 15 + 20
      expect(analytics.metrics.totalTime).toBe(420); // 180 + 240
    });

    it('should generate recommendations based on user behavior', async () => {
      // Mock unbalanced character affinity
      const unbalancedProgress = {
        ...mockUserProgress,
        characterAffinities: {
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            level: 10,
          },
          shun: {
            ...mockUserProgress.characterAffinities.shun,
            level: 50, // Much higher than aoi
          },
        },
      };
      
      mockStorageService.get.mockResolvedValueOnce(unbalancedProgress);
      
      const analytics = await progressionService.generateEngagementAnalytics(testUserId);
      
      expect(analytics.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'character',
            suggestion: expect.stringContaining('蒼'),
          }),
        ])
      );
    });

    it('should support different analytics periods', async () => {
      const dailyAnalytics = await progressionService.generateEngagementAnalytics(testUserId, 'daily');
      const monthlyAnalytics = await progressionService.generateEngagementAnalytics(testUserId, 'monthly');
      
      expect(dailyAnalytics.period).toBe('daily');
      expect(monthlyAnalytics.period).toBe('monthly');
      
      // Check that date ranges are different
      const dailyDays = Math.round((dailyAnalytics.endDate.getTime() - dailyAnalytics.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyDays = Math.round((monthlyAnalytics.endDate.getTime() - monthlyAnalytics.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(dailyDays).toBeLessThan(monthlyDays);
    });
  });

  describe('User Progress Management', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should retrieve user progress from storage', async () => {
      const progress = await progressionService.getUserProgress(testUserId);
      
      expect(progress).toEqual(mockUserProgress);
      expect(mockStorageService.get).toHaveBeenCalledWith(`user_progress_${testUserId}`);
    });

    it('should create default progress for new users', async () => {
      mockStorageService.get.mockResolvedValueOnce(null);
      
      const progress = await progressionService.getUserProgress('new-user');
      
      expect(progress).toMatchObject({
        userId: 'new-user',
        level: 1,
        totalExperience: 0,
        characterAffinities: {
          aoi: expect.objectContaining({level: 1}),
          shun: expect.objectContaining({level: 1}),
        },
      });
    });

    it('should handle storage errors gracefully', async () => {
      mockStorageService.get.mockRejectedValue(new Error('Storage error'));
      
      const progress = await progressionService.getUserProgress(testUserId);
      
      expect(progress.userId).toBe(testUserId);
      expect(progress.level).toBe(1);
    });

    it('should update and save user progress', async () => {
      const updatedProgress = await progressionService.updateUserProgress(testUserId, {
        level: 6,
        totalExperience: 1500,
      });
      
      expect(updatedProgress.level).toBe(6);
      expect(updatedProgress.totalExperience).toBe(1500);
      expect(mockStorageService.save).toHaveBeenCalledWith(
        `user_progress_${testUserId}`,
        expect.objectContaining({
          level: 6,
          totalExperience: 1500,
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should handle progress update errors gracefully', async () => {
      mockStorageService.save.mockRejectedValue(new Error('Save failed'));
      
      await expect(
        progressionService.updateUserProgress(testUserId, {level: 6})
      ).rejects.toThrow();
    });

    it('should handle achievement checking errors', async () => {
      // Mock getUserProgress to fail
      mockStorageService.get.mockRejectedValue(new Error('Get failed'));
      
      const earnedAchievements = await progressionService.checkAchievements(testUserId, mockUserProgress);
      
      // Should still process achievements even if storage fails
      expect(earnedAchievements).toBeDefined();
    });

    it('should handle milestone checking errors', async () => {
      const invalidProgress = {
        ...mockUserProgress,
        characterAffinities: null as any, // Invalid data
      };
      
      const unlockedMilestones = await progressionService.checkMilestones(testUserId, invalidProgress);
      
      expect(unlockedMilestones).toHaveLength(0);
    });
  });

  describe('Integration with Other Services', () => {
    beforeEach(async () => {
      await progressionService.initialize();
    });

    it('should track achievement progress across multiple updates', async () => {
      // First update - partial progress
      await progressionService.updateUserProgress(testUserId, {
        ...mockUserProgress,
        characterAffinities: {
          ...mockUserProgress.characterAffinities,
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            level: 30,
          },
        },
      });

      // Second update - should complete achievement
      const finalProgress = await progressionService.updateUserProgress(testUserId, {
        ...mockUserProgress,
        characterAffinities: {
          ...mockUserProgress.characterAffinities,
          aoi: {
            ...mockUserProgress.characterAffinities.aoi,
            level: 50,
          },
        },
      });

      expect(finalProgress.characterAffinities.aoi.level).toBe(50);
    });

    it('should maintain consistency between achievements and milestones', async () => {
      const achievements = progressionService.getAllAchievements();
      const milestones = progressionService.getAllMilestones();
      
      // Ensure no duplicate reward systems
      const achievementIds = achievements.map(a => a.id);
      const milestoneIds = milestones.map(m => m.id);
      
      expect(new Set(achievementIds).size).toBe(achievementIds.length);
      expect(new Set(milestoneIds).size).toBe(milestoneIds.length);
    });
  });
});