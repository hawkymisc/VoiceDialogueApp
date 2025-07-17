// User profile and settings-related type definitions

import {ScenarioType, EmotionType} from './Dialogue';
import {Character, CharacterType, RelationshipSettings} from './Character';

export interface AudioSettings {
  volume: number; // 0-100
  speed: number; // 0.5-2.0
  autoPlay: boolean;
  enableSoundEffects: boolean;
  preferredVoiceQuality: 'standard' | 'high' | 'premium';
}

export interface PrivacySettings {
  shareConversations: boolean;
  allowDataCollection: boolean;
  showOnlineStatus: boolean;
  enableAnalytics: boolean;
  ageVerified: boolean;
}

export interface UserPreferences {
  favoriteScenarios: ScenarioType[];
  characterCustomizations: Record<CharacterType, Partial<Character>>;
  audioSettings: AudioSettings;
  privacySettings: PrivacySettings;
  relationshipSettings: Record<CharacterType, RelationshipSettings>;
  language: 'ja' | 'en';
  theme: 'light' | 'dark' | 'auto';
}

export interface UserStatistics {
  totalConversations: number;
  favoriteCharacter: CharacterType | null;
  averageSessionLength: number; // in minutes
  lastActiveDate: Date;
  totalPlayTime: number; // in minutes
  conversationsByScenario: Record<ScenarioType, number>;
  favoriteEmotions: EmotionType[];
  achievementCount: number;
}

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  statistics: UserStatistics;
  subscriptionTier: 'free' | 'premium' | 'vip';
  isActive: boolean;
}

export interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  favoriteConversations: string[]; // conversation IDs
  unlockedContent: string[]; // content IDs
}

// User actions and preferences
export interface UserAction {
  type:
    | 'conversation_start'
    | 'conversation_end'
    | 'favorite_add'
    | 'favorite_remove'
    | 'settings_update';
  timestamp: Date;
  data: Record<string, any>;
}

export interface LearningData {
  preferredTopics: string[];
  conversationPatterns: Record<string, number>;
  emotionalResponses: Record<EmotionType, number>;
  characterAffinities: Record<CharacterType, number>;
}

export interface UserProgress {
  level: number;
  experience: number;
  unlockedFeatures: string[];
  achievements: Achievement[];
  dailyStreak: number;
  lastStreakDate: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: Date;
  category: 'conversation' | 'character' | 'time' | 'special';
}
