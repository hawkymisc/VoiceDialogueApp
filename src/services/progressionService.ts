import {
  UserProgress,
  Achievement,
  WeeklyGoal,
  ProgressionMilestone,
  EngagementAnalytics,
  ContentReward,
} from '../types/Engagement';
import {CharacterType} from '../types/Character';
import {storageService} from './storageService';

class ProgressionService {
  private achievements: Map<string, Achievement> = new Map();
  private milestones: Map<string, ProgressionMilestone> = new Map();
  private weeklyGoals: Map<string, WeeklyGoal> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeAchievements();
    this.initializeMilestones();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadStoredData();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize progression service:', error);
      throw new Error('Progression service initialization failed');
    }
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: 'first_conversation',
        name: '初めての会話',
        description: 'キャラクターとの最初の会話を完了しました',
        category: 'conversation',
        type: 'milestone',
        conditions: {
          metric: 'conversation_count',
          target: 1,
        },
        rewards: [
          {
            id: 'first_conv_exp',
            type: 'experience',
            amount: 100,
            description: '経験値 +100',
          },
        ],
        progress: 0,
        isHidden: false,
        isEarned: false,
      },
      {
        id: 'daily_streak_7',
        name: '7日連続ログイン',
        description: '7日間連続でアプリを利用しました',
        category: 'time',
        type: 'challenge',
        conditions: {
          metric: 'daily_streak',
          target: 7,
          timeframe: 'all_time',
        },
        rewards: [
          {
            id: 'streak_exp',
            type: 'experience',
            amount: 300,
            description: '経験値 +300',
          },
          {
            id: 'streak_unlock',
            type: 'unlock',
            unlockContent: 'special_daily_scenario',
            description: '特別な日常シナリオ解放',
          },
        ],
        progress: 0,
        isHidden: false,
        isEarned: false,
      },
      {
        id: 'character_affinity_50',
        name: '深い絆',
        description: 'キャラクターとの好感度が50に到達しました',
        category: 'character',
        type: 'milestone',
        conditions: {
          metric: 'character_affinity',
          target: 50,
        },
        rewards: [
          {
            id: 'affinity_exp',
            type: 'experience',
            amount: 500,
            description: '経験値 +500',
          },
          {
            id: 'intimate_scenarios',
            type: 'unlock',
            unlockContent: 'intimate_scenario_pack',
            description: '親密なシナリオパック解放',
          },
        ],
        progress: 0,
        isHidden: false,
        isEarned: false,
      },
      {
        id: 'exploration_master',
        name: '探索の達人',
        description: '全てのシナリオカテゴリを体験しました',
        category: 'exploration',
        type: 'challenge',
        conditions: {
          metric: 'scenario_categories_completed',
          target: 5,
        },
        rewards: [
          {
            id: 'exploration_exp',
            type: 'experience',
            amount: 800,
            description: '経験値 +800',
          },
          {
            id: 'master_title',
            type: 'achievement',
            achievementId: 'exploration_master_title',
            description: '「探索の達人」称号獲得',
          },
        ],
        progress: 0,
        isHidden: false,
        isEarned: false,
      },
      {
        id: 'secret_moment',
        name: '秘密の瞬間',
        description: '隠された特別なキャラクターモーメントを発見しました',
        category: 'special',
        type: 'hidden',
        conditions: {
          metric: 'hidden_moments_unlocked',
          target: 1,
        },
        rewards: [
          {
            id: 'secret_exp',
            type: 'experience',
            amount: 1000,
            description: '経験値 +1000',
          },
          {
            id: 'secret_cg',
            type: 'unlock',
            unlockContent: 'secret_character_cg',
            description: '秘密のキャラクターCG解放',
          },
        ],
        progress: 0,
        isHidden: true,
        isEarned: false,
      },
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeMilestones(): void {
    const milestones: ProgressionMilestone[] = [
      {
        id: 'beginner_milestone',
        name: 'はじめの一歩',
        description: 'アプリの基本機能を理解し、最初の会話を完了',
        type: 'content',
        requirements: {
          completedContent: ['tutorial_conversation'],
        },
        rewards: {
          experience: 150,
          unlocks: ['basic_scenarios', 'character_customization'],
          characterReactions: [
            {
              characterId: 'aoi',
              reaction: 'よろしくお願いします！',
              emotion: 'happy',
            },
            {
              characterId: 'shun',
              reaction: '君との時間が楽しみだ',
              emotion: 'neutral',
            },
          ],
        },
        isUnlocked: false,
      },
      {
        id: 'friendship_milestone',
        name: '友情の証',
        description: 'キャラクターとの関係が友達レベルに到達',
        type: 'affinity',
        requirements: {
          characterAffinity: {aoi: 25, shun: 25},
        },
        rewards: {
          experience: 400,
          unlocks: ['friendship_scenarios', 'personal_conversations'],
          specialContent: 'friendship_celebration',
        },
        isUnlocked: false,
        celebrationData: {
          animation: 'friendship_sparkles',
          message: 'おめでとう！キャラクターとの絆が深まりました！',
          duration: 3000,
        },
      },
      {
        id: 'time_master_milestone',
        name: 'タイムマスター',
        description: '累計100時間以上の対話時間を達成',
        type: 'time',
        requirements: {
          timeSpent: 6000, // 100 hours in minutes
        },
        rewards: {
          experience: 1500,
          unlocks: ['time_master_scenarios', 'exclusive_dialogues'],
          specialContent: 'time_master_ceremony',
        },
        isUnlocked: false,
      },
      {
        id: 'social_butterfly_milestone',
        name: 'ソーシャルバタフライ',
        description: '様々な社会的シナリオをマスター',
        type: 'social',
        requirements: {
          socialActions: ['workplace_conversation', 'casual_meeting', 'formal_interaction'],
        },
        rewards: {
          experience: 800,
          unlocks: ['advanced_social_scenarios'],
          characterReactions: [
            {
              characterId: 'aoi',
              reaction: '君の社交性、素晴らしいね',
              emotion: 'happy',
            },
            {
              characterId: 'shun',
              reaction: '君との会話はいつも興味深い',
              emotion: 'neutral',
            },
          ],
        },
        isUnlocked: false,
      },
    ];

    milestones.forEach(milestone => {
      this.milestones.set(milestone.id, milestone);
    });
  }

  async updateUserProgress(
    userId: string,
    progressUpdate: Partial<UserProgress>
  ): Promise<UserProgress> {
    try {
      const currentProgress = await this.getUserProgress(userId);
      const updatedProgress = {...currentProgress, ...progressUpdate};

      // Check for achievement progress
      await this.checkAchievements(userId, updatedProgress);
      
      // Check for milestone completion
      await this.checkMilestones(userId, updatedProgress);

      // Save updated progress
      await this.saveUserProgress(userId, updatedProgress);
      
      return updatedProgress;
    } catch (error) {
      console.error('Failed to update user progress:', error);
      throw error;
    }
  }

  async checkAchievements(userId: string, userProgress: UserProgress): Promise<Achievement[]> {
    const earnedAchievements: Achievement[] = [];

    for (const [achievementId, achievement] of this.achievements.entries()) {
      if (achievement.isEarned) continue;

      const progress = this.calculateAchievementProgress(achievement, userProgress);
      achievement.progress = progress;

      if (progress >= 100) {
        achievement.isEarned = true;
        achievement.earnedAt = new Date();
        earnedAchievements.push(achievement);

        // Apply achievement rewards
        await this.applyRewards(achievement.rewards, userId);
      }
    }

    return earnedAchievements;
  }

  private calculateAchievementProgress(
    achievement: Achievement,
    userProgress: UserProgress
  ): number {
    const {metric, target, characterSpecific} = achievement.conditions;

    let current = 0;

    switch (metric) {
      case 'conversation_count':
        current = Object.values(userProgress.characterAffinities)
          .reduce((sum, affinity) => sum + affinity.conversationCount, 0);
        break;
      case 'daily_streak':
        current = userProgress.streakData.currentStreak;
        break;
      case 'character_affinity':
        if (characterSpecific) {
          current = userProgress.characterAffinities[characterSpecific]?.level || 0;
        } else {
          current = Math.max(
            ...Object.values(userProgress.characterAffinities).map(a => a.level)
          );
        }
        break;
      case 'scenario_categories_completed':
        // This would need to be tracked separately in user progress
        current = 0; // Placeholder
        break;
      case 'hidden_moments_unlocked':
        current = userProgress.unlockedMoments.filter(m => m.includes('hidden')).length;
        break;
    }

    return Math.min(Math.round((current / target) * 100), 100);
  }

  async checkMilestones(userId: string, userProgress: UserProgress): Promise<ProgressionMilestone[]> {
    const unlockedMilestones: ProgressionMilestone[] = [];

    for (const [milestoneId, milestone] of this.milestones.entries()) {
      if (milestone.isUnlocked) continue;

      if (this.checkMilestoneRequirements(milestone, userProgress)) {
        milestone.isUnlocked = true;
        milestone.unlockedAt = new Date();
        unlockedMilestones.push(milestone);

        // Apply milestone rewards
        await this.applyMilestoneRewards(milestone, userId);
      }
    }

    return unlockedMilestones;
  }

  private checkMilestoneRequirements(
    milestone: ProgressionMilestone,
    userProgress: UserProgress
  ): boolean {
    const {requirements} = milestone;

    if (requirements.level && userProgress.level < requirements.level) {
      return false;
    }

    if (requirements.characterAffinity) {
      for (const [characterId, requiredLevel] of Object.entries(requirements.characterAffinity)) {
        const currentLevel = userProgress.characterAffinities[characterId as CharacterType]?.level || 0;
        if (currentLevel < requiredLevel) {
          return false;
        }
      }
    }

    if (requirements.timeSpent) {
      const totalTime = Object.values(userProgress.characterAffinities)
        .reduce((sum, affinity) => sum + affinity.timeSpent, 0);
      if (totalTime < requirements.timeSpent) {
        return false;
      }
    }

    if (requirements.completedContent) {
      if (!requirements.completedContent.every(content => 
        userProgress.completedDailyContent.includes(content))) {
        return false;
      }
    }

    return true;
  }

  async generateWeeklyGoals(userId: string): Promise<WeeklyGoal[]> {
    const userProgress = await this.getUserProgress(userId);
    const currentWeek = this.getCurrentWeekString();

    const goals: WeeklyGoal[] = [
      {
        id: `conversation_goal_${currentWeek}`,
        week: currentWeek,
        title: '会話マスター',
        description: '今週は15回以上の会話を目指しましょう',
        type: 'conversation_count',
        target: 15,
        current: 0,
        rewards: [
          {
            id: 'weekly_conversation_exp',
            type: 'experience',
            amount: 200,
            description: '経験値 +200',
          },
        ],
        isCompleted: false,
      },
      {
        id: `affinity_goal_${currentWeek}`,
        week: currentWeek,
        title: '絆を深めよう',
        description: 'キャラクターとの好感度を上げましょう',
        type: 'character_affinity',
        target: 50,
        current: Math.max(
          userProgress.characterAffinities.aoi.level,
          userProgress.characterAffinities.shun.level
        ),
        rewards: [
          {
            id: 'weekly_affinity_unlock',
            type: 'unlock',
            unlockContent: 'weekly_special_scenario',
            description: '特別シナリオ解放',
          },
        ],
        isCompleted: false,
      },
      {
        id: `time_goal_${currentWeek}`,
        week: currentWeek,
        title: '継続は力なり',
        description: '今週は120分以上の対話時間を目指しましょう',
        type: 'time_spent',
        target: 120,
        current: 0,
        rewards: [
          {
            id: 'weekly_time_exp',
            type: 'experience',
            amount: 300,
            description: '経験値 +300',
          },
        ],
        isCompleted: false,
      },
    ];

    goals.forEach(goal => {
      this.weeklyGoals.set(goal.id, goal);
    });

    return goals;
  }

  async generateEngagementAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<EngagementAnalytics> {
    const userProgress = await this.getUserProgress(userId);
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    // In a real implementation, this would fetch data from storage/database
    const analytics: EngagementAnalytics = {
      userId,
      period,
      startDate,
      endDate,
      metrics: {
        sessionCount: 12,
        totalTime: Object.values(userProgress.characterAffinities)
          .reduce((sum, affinity) => sum + affinity.timeSpent, 0),
        averageSessionDuration: 15,
        conversationCount: Object.values(userProgress.characterAffinities)
          .reduce((sum, affinity) => sum + affinity.conversationCount, 0),
        scenarioCompletions: userProgress.completedDailyContent.length,
        charactersInteractedWith: Object.keys(userProgress.characterAffinities) as CharacterType[],
        mostActiveTimeSlot: '19:00-21:00',
        retentionRate: 85,
        engagementScore: Math.min(userProgress.level * 10, 100),
      },
      trends: [
        {metric: 'conversation_count', direction: 'up', changePercentage: 15},
        {metric: 'session_duration', direction: 'stable', changePercentage: 2},
        {metric: 'engagement_score', direction: 'up', changePercentage: 8},
      ],
      recommendations: this.generateRecommendations(userProgress),
    };

    return analytics;
  }

  private generateRecommendations(userProgress: UserProgress) {
    const recommendations = [];

    // Check character balance
    const aoiLevel = userProgress.characterAffinities.aoi.level;
    const shunLevel = userProgress.characterAffinities.shun.level;
    
    if (Math.abs(aoiLevel - shunLevel) > 10) {
      const lowerCharacter = aoiLevel < shunLevel ? '蒼' : '瞬';
      recommendations.push({
        type: 'character' as const,
        suggestion: `${lowerCharacter}との会話を増やしてみませんか？`,
        reasoning: 'キャラクター間の好感度バランスを保つことで、より豊富なコンテンツを楽しめます',
        priority: 1,
      });
    }

    // Check streak
    if (userProgress.streakData.currentStreak < 3) {
      recommendations.push({
        type: 'timing' as const,
        suggestion: '毎日少しずつでも会話を続けてみましょう',
        reasoning: '継続的な利用により、より深いキャラクター体験が可能になります',
        priority: 2,
      });
    }

    // Check content variety
    if (userProgress.completedDailyContent.length < 10) {
      recommendations.push({
        type: 'content' as const,
        suggestion: '新しいシナリオジャンルにチャレンジしてみませんか？',
        reasoning: '様々なシナリオを体験することで、キャラクターの新しい一面を発見できます',
        priority: 3,
      });
    }

    return recommendations;
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const stored = await storageService.get(`user_progress_${userId}`);
      return stored || this.createDefaultUserProgress(userId);
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return this.createDefaultUserProgress(userId);
    }
  }

  private createDefaultUserProgress(userId: string): UserProgress {
    return {
      userId,
      level: 1,
      totalExperience: 0,
      characterAffinities: {
        aoi: {
          level: 1,
          experience: 0,
          timeSpent: 0,
          conversationCount: 0,
          lastInteraction: new Date(),
        },
        shun: {
          level: 1,
          experience: 0,
          timeSpent: 0,
          conversationCount: 0,
          lastInteraction: new Date(),
        },
      },
      completedDailyContent: [],
      participatedEvents: [],
      unlockedMoments: [],
      achievements: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
      },
      weeklyGoals: [],
      preferences: {
        preferredTimeSlots: [],
        notificationSettings: {
          dailyReminder: true,
          newContent: true,
          achievements: true,
          events: true,
          characterMoments: true,
          weeklyGoals: true,
        },
        preferredContentTypes: [],
        difficultyPreference: 'mixed',
        sessionDurationPreference: 15,
        autoProgressUnlock: true,
      },
    };
  }

  private async saveUserProgress(userId: string, progress: UserProgress): Promise<void> {
    try {
      await storageService.save(`user_progress_${userId}`, progress);
    } catch (error) {
      console.error('Failed to save user progress:', error);
      throw error;
    }
  }

  private async applyRewards(rewards: ContentReward[], userId: string): Promise<void> {
    // Implementation would apply rewards to user progress
    console.log(`Applying rewards for user ${userId}:`, rewards);
  }

  private async applyMilestoneRewards(milestone: ProgressionMilestone, userId: string): Promise<void> {
    // Implementation would apply milestone rewards
    console.log(`Applying milestone rewards for user ${userId}:`, milestone.rewards);
  }

  private getCurrentWeekString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private async loadStoredData(): Promise<void> {
    // Implementation would load stored achievements, milestones, etc.
  }

  // Public getters
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getAllMilestones(): ProgressionMilestone[] {
    return Array.from(this.milestones.values());
  }

  getWeeklyGoals(): WeeklyGoal[] {
    return Array.from(this.weeklyGoals.values());
  }
}

export const progressionService = new ProgressionService();
export default progressionService;