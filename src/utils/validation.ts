// Validation utility functions
// This will be expanded as needed

export const validatePersonalityValue = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

export const validateCharacterAge = (age: number): boolean => {
  return age >= 0 && age <= 150;
};

export const validateVoiceSpeed = (speed: number): boolean => {
  return speed >= 0.5 && speed <= 2.0;
};

export const validateVoicePitch = (pitch: number): boolean => {
  return pitch >= 0 && pitch <= 100;
};

export const validateUserId = (userId: string): boolean => {
  return userId.length > 0 && userId.length <= 50;
};

export const validateRelationshipLevel = (level: number): boolean => {
  return level >= 0 && level <= 100;
};

export default {
  validatePersonalityValue,
  validateCharacterAge,
  validateVoiceSpeed,
  validateVoicePitch,
  validateUserId,
  validateRelationshipLevel,
};
