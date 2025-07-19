import {CharacterType} from './Character';
import {EmotionType} from './Dialogue';

export type ScenarioCategory = 
  | 'daily' 
  | 'work' 
  | 'special' 
  | 'romantic' 
  | 'comedy' 
  | 'drama' 
  | 'seasonal';

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ScenarioTags = 
  | 'indoor' 
  | 'outdoor' 
  | 'evening' 
  | 'morning' 
  | 'weekend' 
  | 'school' 
  | 'office' 
  | 'home' 
  | 'cafe' 
  | 'park' 
  | 'library';

export interface ScenarioContext {
  location: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: string;
  mood: EmotionType;
  relationship_stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'romantic_interest';
  previous_events?: string[];
}

export interface DialogueTrigger {
  condition: string;
  response_hints: string[];
  emotion_triggers: EmotionType[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  tags: ScenarioTags[];
  
  // Character compatibility
  compatible_characters: CharacterType[];
  recommended_character: CharacterType;
  
  // Context and setting
  context: ScenarioContext;
  setting_description: string;
  duration_estimate: number; // in minutes
  
  // Dialogue guidance
  conversation_starters: string[];
  dialogue_triggers: DialogueTrigger[];
  suggested_topics: string[];
  
  // Emotional arc
  target_emotions: EmotionType[];
  emotional_progression: Array<{
    stage: number;
    emotion: EmotionType;
    description: string;
  }>;
  
  // Unlock conditions
  is_unlocked: boolean;
  unlock_requirements?: {
    completed_scenarios?: string[];
    intimacy_level?: number;
    character_affinity?: Record<CharacterType, number>;
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  usage_count: number;
  user_rating?: number;
  is_favorite: boolean;
}

export interface ScenarioProgress {
  scenario_id: string;
  user_id: string;
  started_at: Date;
  completed_at?: Date;
  current_stage: number;
  total_stages: number;
  dialogue_count: number;
  emotions_triggered: EmotionType[];
  key_moments: Array<{
    timestamp: Date;
    moment_type: 'emotional_peak' | 'character_development' | 'story_progression';
    description: string;
    emotion: EmotionType;
  }>;
  is_completed: boolean;
  user_satisfaction?: number; // 1-5 rating
}

export interface ScenarioRecommendation {
  scenario: Scenario;
  compatibility_score: number;
  reason: string;
  estimated_enjoyment: number;
  similar_scenarios: string[];
}

export interface ScenarioFilter {
  categories?: ScenarioCategory[];
  characters?: CharacterType[];
  difficulty?: ScenarioDifficulty[];
  tags?: ScenarioTags[];
  duration_range?: {
    min: number;
    max: number;
  };
  only_unlocked?: boolean;
  only_favorites?: boolean;
  exclude_completed?: boolean;
}

export interface ScenarioSearchQuery {
  query: string;
  filters: ScenarioFilter;
  sort_by: 'popularity' | 'rating' | 'created_at' | 'title' | 'duration' | 'compatibility';
  sort_order: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ScenarioCollection {
  id: string;
  name: string;
  description: string;
  scenarios: string[]; // scenario IDs
  is_curated: boolean;
  curator?: string;
  theme?: string;
  created_at: Date;
  updated_at: Date;
}

// Predefined scenario templates for quick setup
export interface ScenarioTemplate {
  id: string;
  name: string;
  category: ScenarioCategory;
  template_description: string;
  customizable_elements: string[];
  generate_scenario: (params: Record<string, any>) => Omit<Scenario, 'id' | 'created_at' | 'updated_at' | 'usage_count'>;
}

// Events that can occur during scenarios
export interface ScenarioEvent {
  id: string;
  scenario_id: string;
  event_type: 'dialogue_milestone' | 'emotion_change' | 'story_branch' | 'character_reaction';
  trigger_condition: string;
  character_response: string;
  emotion_impact: Record<EmotionType, number>;
  story_impact: string;
  unlock_content?: string[];
}

// User preferences for scenario generation
export interface ScenarioPreferences {
  user_id: string;
  preferred_categories: ScenarioCategory[];
  preferred_characters: CharacterType[];
  preferred_difficulty: ScenarioDifficulty;
  preferred_duration: number;
  favorite_tags: ScenarioTags[];
  avoided_tags: ScenarioTags[];
  emotional_preferences: EmotionType[];
  conversation_style: 'casual' | 'formal' | 'playful' | 'serious' | 'romantic';
  pacing_preference: 'slow' | 'medium' | 'fast';
  surprise_factor: number; // 0-1, how much user likes unexpected turns
}

// Analytics for scenario performance
export interface ScenarioAnalytics {
  scenario_id: string;
  total_sessions: number;
  completion_rate: number;
  average_rating: number;
  average_duration: number;
  emotion_distribution: Record<EmotionType, number>;
  most_common_dialogues: string[];
  user_feedback: Array<{
    user_id: string;
    rating: number;
    feedback: string;
    created_at: Date;
  }>;
  character_performance: Record<CharacterType, {
    usage_count: number;
    satisfaction_rating: number;
    preferred_dialogue_types: string[];
  }>;
}