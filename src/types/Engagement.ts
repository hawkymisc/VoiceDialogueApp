import {CharacterType} from './Character';
import {EmotionType} from './Dialogue';
import {ScenarioCategory} from './Scenario';

export type EventType = 'daily' | 'weekly' | 'seasonal' | 'special' | 'character_birthday' | 'anniversary';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type NotificationType = 'new_content' | 'daily_bonus' | 'achievement' | 'reminder' | 'event';

export interface DailyContent {
  id: string;
  date: Date;
  type: 'scenario' | 'dialogue_starter' | 'special_event' | 'character_moment';
  title: string;
  description: string;
  content: {
    scenarioId?: string;
    dialogueStarter?: string;
    specialEvent?: SpecialEvent;
    characterMoment?: CharacterMoment;
  };
  characterId?: CharacterType;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // minutes
  rewards: ContentReward[];
  prerequisites?: string[];
  expiresAt?: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  season?: SeasonType;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  backgroundImage?: string;
  bgm?: string;
  specialDialogues: Array<{
    characterId: CharacterType;
    dialogue: string;
    emotion: EmotionType;
    conditions?: string[];
  }>;
  eventScenarios: string[];
  rewards: EventReward[];
  participationRequirements?: {
    minLevel?: number;
    completedScenarios?: string[];
    characterAffinity?: Record<CharacterType, number>;
  };
}

export interface CharacterMoment {
  id: string;
  characterId: CharacterType;
  title: string;
  description: string;
  momentType: 'memory' | 'special_dialogue' | 'emotion_reveal' | 'backstory';
  content: {
    dialogue?: string;
    emotion?: EmotionType;
    backgroundInfo?: string;
    specialAnimation?: string;
  };
  unlockConditions: {
    affinityLevel: number;
    completedScenarios?: string[];
    timeSpent?: number; // minutes
    specificActions?: string[];
  };
  rewards: MomentReward[];
}

export interface ContentReward {
  id: string;
  type: 'experience' | 'affinity' | 'unlock' | 'item' | 'achievement';
  amount?: number;
  targetCharacter?: CharacterType;
  unlockContent?: string;
  itemId?: string;
  achievementId?: string;
  description: string;
}

export interface EventReward extends ContentReward {
  eventExclusive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MomentReward extends ContentReward {
  emotionalImpact: EmotionType;
  memoryUnlocked?: string;
}

export interface UserProgress {
  userId: string;
  level: number;
  totalExperience: number;
  characterAffinities: Record<CharacterType, {
    level: number;
    experience: number;
    timeSpent: number;
    conversationCount: number;
    lastInteraction: Date;
  }>;
  completedDailyContent: string[];
  participatedEvents: string[];
  unlockedMoments: string[];
  achievements: Achievement[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
  };
  weeklyGoals: WeeklyGoal[];
  preferences: EngagementPreferences;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'conversation' | 'character' | 'exploration' | 'time' | 'special';
  type: 'milestone' | 'challenge' | 'hidden' | 'seasonal';
  conditions: {
    metric: string;
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
    characterSpecific?: CharacterType;
  };
  rewards: ContentReward[];
  iconUrl?: string;
  earnedAt?: Date;
  progress: number;
  isHidden: boolean;
  isEarned: boolean;
}

export interface WeeklyGoal {
  id: string;
  week: string; // YYYY-WW format
  title: string;
  description: string;
  type: 'conversation_count' | 'scenario_completion' | 'character_affinity' | 'time_spent';
  target: number;
  current: number;
  rewards: ContentReward[];
  isCompleted: boolean;
  completedAt?: Date;
}

export interface EngagementPreferences {
  preferredTimeSlots: Array<{
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    days: number[]; // 0-6, Sunday-Saturday
  }>;
  notificationSettings: {
    dailyReminder: boolean;
    newContent: boolean;
    achievements: boolean;
    events: boolean;
    characterMoments: boolean;
    weeklyGoals: boolean;
  };
  preferredContentTypes: ScenarioCategory[];
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'mixed';
  sessionDurationPreference: number; // minutes
  autoProgressUnlock: boolean;
}

export interface SeasonalTheme {
  season: SeasonType;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  decorations: string[];
  bgm?: string;
  specialScenarios: string[];
  characterOutfits?: Record<CharacterType, string>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  actionButton?: {
    label: string;
    action: string;
    data?: any;
  };
}

export interface EngagementAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    sessionCount: number;
    totalTime: number;
    averageSessionDuration: number;
    conversationCount: number;
    scenarioCompletions: number;
    charactersInteractedWith: CharacterType[];
    mostActiveTimeSlot: string;
    retentionRate: number;
    engagementScore: number;
  };
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
  }[];
  recommendations: {
    type: 'content' | 'timing' | 'character' | 'feature';
    suggestion: string;
    reasoning: string;
    priority: number;
  }[];
}

export interface ContentSchedule {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'event_based';
  rules: {
    frequency: number;
    contentTypes: string[];
    characterRotation?: boolean;
    difficultyProgression?: boolean;
    seasonalVariation?: boolean;
  };
  template: {
    titleFormat: string;
    descriptionFormat: string;
    rewardStructure: ContentReward[];
    durationRange: [number, number];
  };
  isActive: boolean;
  lastGenerated?: Date;
  nextGeneration: Date;
}

export interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  type: 'level' | 'affinity' | 'time' | 'content' | 'social';
  requirements: {
    level?: number;
    characterAffinity?: Record<CharacterType, number>;
    timeSpent?: number;
    completedContent?: string[];
    socialActions?: string[];
  };
  rewards: {
    experience: number;
    unlocks: string[];
    specialContent?: string;
    characterReactions?: Array<{
      characterId: CharacterType;
      reaction: string;
      emotion: EmotionType;
    }>;
  };
  isUnlocked: boolean;
  unlockedAt?: Date;
  celebrationData?: {
    animation: string;
    message: string;
    duration: number;
  };
}