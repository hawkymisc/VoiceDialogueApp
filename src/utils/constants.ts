// Application constants
// This will be expanded as needed

export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'ja',
  API_TIMEOUT: 10000,
} as const;

export const VOICE_CONSTANTS = {
  DEFAULT_PITCH: 50,
  DEFAULT_SPEED: 1.0,
  DEFAULT_VOLUME: 1.0,
} as const;

export const CHARACTER_CONSTANTS = {
  MAX_PERSONALITY_VALUE: 100,
  MIN_PERSONALITY_VALUE: 0,
  DEFAULT_RELATIONSHIP_INTIMACY: 20,
  DEFAULT_RELATIONSHIP_TRUST: 30,
} as const;

export default {
  APP_CONSTANTS,
  VOICE_CONSTANTS,
  CHARACTER_CONSTANTS,
};
