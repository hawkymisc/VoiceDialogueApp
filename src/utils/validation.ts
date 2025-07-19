// Validation utility functions
import type {Character, CharacterType, PersonalityTraits, AppearanceSettings, VoiceSettings, RelationshipSettings} from '../types/Character';
import type {UserProfile, UserPreferences} from '../types/User';
import type {DialogueMessage, DialogueScenario, EmotionState} from '../types/Dialogue';

export const validatePersonalityValue = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && value <= 100;
};

export const validateCharacterAge = (age: number): boolean => {
  return typeof age === 'number' && age >= 0 && age <= 150;
};

export const validateVoiceSpeed = (speed: number): boolean => {
  return typeof speed === 'number' && speed >= 0.5 && speed <= 2.0;
};

export const validateVoicePitch = (pitch: number): boolean => {
  return typeof pitch === 'number' && pitch >= 0 && pitch <= 100;
};

export const validateUserId = (userId: string): boolean => {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 50;
};

export const validateRelationshipLevel = (level: number): boolean => {
  return typeof level === 'number' && level >= 0 && level <= 100;
};

// Character validation
export const validateCharacterData = (character: any): boolean => {
  if (!character || typeof character !== 'object') return false;
  
  if (typeof character.id !== 'string' || character.id.length === 0) return false;
  if (typeof character.name !== 'string' || character.name.length === 0) return false;
  if (!validateCharacterAge(character.age)) return false;
  if (typeof character.description !== 'string') return false;
  if (typeof character.backstory !== 'string') return false;
  
  if (!validatePersonalityTraits(character.personality)) return false;
  if (!validateAppearanceSettings(character.appearance)) return false;
  if (!validateVoiceSettings(character.voiceSettings)) return false;
  
  return true;
};

export const validatePersonalityTraits = (traits: any): boolean => {
  if (!traits || typeof traits !== 'object') return false;
  
  return validatePersonalityValue(traits.aggressiveness) &&
         validatePersonalityValue(traits.kindness) &&
         validatePersonalityValue(traits.tsundereLevel) &&
         validatePersonalityValue(traits.shyness);
};

export const validateAppearanceSettings = (appearance: any): boolean => {
  if (!appearance || typeof appearance !== 'object') return false;
  
  if (typeof appearance.hairColor !== 'string') return false;
  if (typeof appearance.eyeColor !== 'string') return false;
  if (!appearance.clothing || typeof appearance.clothing !== 'object') return false;
  if (!appearance.expressions || typeof appearance.expressions !== 'object') return false;
  
  // Validate clothing object
  if (typeof appearance.clothing.id !== 'string') return false;
  if (typeof appearance.clothing.name !== 'string') return false;
  if (typeof appearance.clothing.category !== 'string') return false;
  
  // Validate valid clothing category
  const validCategories = ['casual', 'formal', 'special'];
  if (!validCategories.includes(appearance.clothing.category)) return false;
  
  return true;
};

export const validateVoiceSettings = (voice: any): boolean => {
  if (!voice || typeof voice !== 'object') return false;
  
  if (!validateVoicePitch(voice.pitch)) return false;
  if (typeof voice.tone !== 'string') return false;
  if (!validateVoiceSpeed(voice.speed)) return false;
  if (!validatePersonalityValue(voice.emotionalRange)) return false;
  if (typeof voice.voiceId !== 'string') return false;
  
  return true;
};

export const validateRelationshipSettings = (relationship: any): boolean => {
  if (!relationship || typeof relationship !== 'object') return false;
  
  const validTypes = ['senpai-kohai', 'boss-subordinate', 'childhood-friends', 'strangers'];
  if (!validTypes.includes(relationship.type)) return false;
  
  if (!validateRelationshipLevel(relationship.intimacyLevel)) return false;
  if (!validateRelationshipLevel(relationship.trustLevel)) return false;
  
  return true;
};

// User validation
export const validateUserProfile = (profile: any): boolean => {
  if (!profile || typeof profile !== 'object') return false;
  
  if (!validateUserId(profile.id)) return false;
  
  // Check timestamps - can be number or Date
  const createdAt = typeof profile.createdAt === 'number' ? new Date(profile.createdAt) : profile.createdAt;
  
  if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) return false;
  
  // Check for future timestamps
  const now = new Date();
  if (createdAt > now) return false;
  
  // Check lastActiveAt if present (could be lastLoginAt in some contexts)
  if (profile.lastActiveAt !== undefined) {
    const lastActiveAt = typeof profile.lastActiveAt === 'number' ? new Date(profile.lastActiveAt) : profile.lastActiveAt;
    if (!(lastActiveAt instanceof Date) || isNaN(lastActiveAt.getTime())) return false;
    if (lastActiveAt > now) return false;
  }
  
  // Optional fields validation
  if (profile.name !== undefined && (typeof profile.name !== 'string' || profile.name.length === 0)) return false;
  if (profile.email !== undefined && typeof profile.email !== 'string') return false;
  if (profile.avatar !== undefined && typeof profile.avatar !== 'string') return false;
  
  return true;
};

export const validateUserPreferences = (preferences: any): boolean => {
  if (!preferences || typeof preferences !== 'object') return false;
  
  if (typeof preferences.theme !== 'string') return false;
  if (typeof preferences.language !== 'string') return false;
  
  // Check optional boolean fields
  if (preferences.voiceEnabled !== undefined && typeof preferences.voiceEnabled !== 'boolean') return false;
  if (preferences.notificationsEnabled !== undefined && typeof preferences.notificationsEnabled !== 'boolean') return false;
  if (preferences.autoSave !== undefined && typeof preferences.autoSave !== 'boolean') return false;
  
  // Check optional string fields
  if (preferences.fontSize !== undefined && typeof preferences.fontSize !== 'string') return false;
  if (preferences.animationSpeed !== undefined && typeof preferences.animationSpeed !== 'string') return false;
  
  return true;
};

// Dialogue validation
export const validateDialogueMessage = (message: any): boolean => {
  if (!message || typeof message !== 'object') return false;
  
  if (typeof message.id !== 'string' || message.id.length === 0) return false;
  if (typeof message.text !== 'string' || message.text.length === 0) return false;
  
  // Check timestamp - can be number or Date
  const timestamp = typeof message.timestamp === 'number' ? new Date(message.timestamp) : message.timestamp;
  if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) return false;
  
  // Check sender (could be characterId in some contexts)
  if (message.sender !== undefined && typeof message.sender !== 'string') return false;
  if (message.characterId !== undefined && typeof message.characterId !== 'string') return false;
  
  if (message.emotion && !isValidEmotionState(message.emotion)) return false;
  
  return true;
};

export const validateDialogueScenario = (scenario: any): boolean => {
  if (!scenario || typeof scenario !== 'object') return false;
  
  if (typeof scenario.id !== 'string' || scenario.id.length === 0) return false;
  if (typeof scenario.title !== 'string' || scenario.title.length === 0) return false;
  if (typeof scenario.description !== 'string') return false;
  if (!Array.isArray(scenario.tags)) return false;
  if (typeof scenario.difficulty !== 'string') return false;
  
  return true;
};

// Type guards
export const isValidCharacterType = (type: any): type is CharacterType => {
  return type === 'aoi' || type === 'shun';
};

export const isValidEmotionState = (emotion: any): emotion is EmotionState => {
  const validEmotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'embarrassed', 'excited', 'confused'];
  return typeof emotion === 'string' && validEmotions.includes(emotion);
};

export const isValidPlaybackState = (state: any): boolean => {
  const validStates = ['stopped', 'playing', 'paused'];
  return typeof state === 'string' && validStates.includes(state);
};

// Utility functions
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script[^>]*>(.*?)<\/script>/gi, '$1') // Extract content from script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
};

export const validateApiResponse = (response: any): boolean => {
  if (!response || typeof response !== 'object') return false;
  
  // Basic API response structure validation
  if (response.error && typeof response.error !== 'string') return false;
  if (response.success && typeof response.success !== 'boolean') return false;
  
  return true;
};

export default {
  validatePersonalityValue,
  validateCharacterAge,
  validateVoiceSpeed,
  validateVoicePitch,
  validateUserId,
  validateRelationshipLevel,
  validateCharacterData,
  validatePersonalityTraits,
  validateAppearanceSettings,
  validateVoiceSettings,
  validateRelationshipSettings,
  validateUserProfile,
  validateUserPreferences,
  validateDialogueMessage,
  validateDialogueScenario,
  isValidCharacterType,
  isValidEmotionState,
  isValidPlaybackState,
  sanitizeUserInput,
  validateApiResponse,
};
