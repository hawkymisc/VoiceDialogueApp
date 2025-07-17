// Character-related type definitions

export interface PersonalityTraits {
  aggressiveness: number; // 0-100
  kindness: number; // 0-100
  tsundereLevel: number; // 0-100
  shyness: number; // 0-100
}

export interface ClothingSet {
  id: string;
  name: string;
  category: 'casual' | 'formal' | 'special';
  imageUrl: string;
}

export interface ExpressionSet {
  neutral: string;
  happy: string;
  sad: string;
  angry: string;
  surprised: string;
  embarrassed: string;
}

export interface AppearanceSettings {
  hairColor: string;
  eyeColor: string;
  clothing: ClothingSet;
  expressions: ExpressionSet;
}

export interface VoiceSettings {
  pitch: number; // 0-100
  tone: string;
  speed: number; // 0.5-2.0
  emotionalRange: number; // 0-100
  voiceId: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  personality: PersonalityTraits;
  appearance: AppearanceSettings;
  voiceSettings: VoiceSettings;
  description: string;
  backstory: string;
}

export type CharacterType = 'aoi' | 'shun';

export interface CharacterState {
  characters: Record<CharacterType, Character>;
  activeCharacter: CharacterType | null;
  relationship: RelationshipSettings;
  isLoading: boolean;
  error: string | null;
}

// Character customization types
export interface CharacterCustomization {
  characterId: string;
  personalityChanges: Partial<PersonalityTraits>;
  appearanceChanges: Partial<AppearanceSettings>;
  voiceChanges: Partial<VoiceSettings>;
}

export type RelationshipType =
  | 'senpai-kohai'
  | 'boss-subordinate'
  | 'childhood-friends'
  | 'strangers';

export interface RelationshipSettings {
  type: RelationshipType;
  intimacyLevel: number; // 0-100
  trustLevel: number; // 0-100
}

// Re-export EmotionState from Dialogue types for convenience
export type {EmotionState} from './Dialogue';
