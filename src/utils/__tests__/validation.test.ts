import {
  validateCharacterData,
  validateUserProfile,
  validateUserPreferences,
  validateDialogueMessage,
  validateVoiceSettings,
  validatePersonalityTraits,
  validateAppearanceSettings,
  validateDialogueScenario,
  validateRelationshipSettings,
  isValidCharacterType,
  isValidEmotionState,
  isValidPlaybackState,
  sanitizeUserInput,
  validateApiResponse,
} from '../validation';

import {Character, CharacterType, PersonalityTraits, AppearanceSettings, VoiceSettings, RelationshipSettings} from '../../types/Character';
import {UserProfile, UserPreferences} from '../../types/User';
import {DialogueMessage, DialogueScenario, EmotionState} from '../../types/Dialogue';
import {PlaybackState} from '../../types/Audio';

describe('validation', () => {
  describe('validateCharacterData', () => {
    it('should validate correct character data', () => {
      const validCharacter: Character = {
        id: 'aoi',
        name: '蒼',
        age: 22,
        description: 'Test character',
        backstory: 'Test backstory',
        personality: {
          aggressiveness: 30,
          kindness: 85,
          tsundereLevel: 20,
          shyness: 60,
        },
        appearance: {
          hairColor: '#4A90E2',
          eyeColor: '#2E5BBA',
          clothing: {
            id: 'casual_01',
            name: 'Casual Shirt',
            category: 'casual',
            imageUrl: '/assets/clothing/casual_01.png',
          },
          expressions: {
            neutral: '/assets/expressions/neutral.png',
            happy: '/assets/expressions/happy.png',
            sad: '/assets/expressions/sad.png',
            angry: '/assets/expressions/angry.png',
            surprised: '/assets/expressions/surprised.png',
            embarrassed: '/assets/expressions/embarrassed.png',
          },
        },
        voiceSettings: {
          pitch: 75,
          tone: 'clear_young_male',
          speed: 1.0,
          emotionalRange: 80,
          voiceId: 'ja-JP-KeitaNeural',
        },
      };

      expect(validateCharacterData(validCharacter)).toBe(true);
    });

    it('should reject invalid character data', () => {
      const invalidCharacter = {
        id: '', // Invalid empty id
        name: '蒼',
        age: -1, // Invalid negative age
        personality: {
          aggressiveness: 150, // Invalid range
          kindness: 85,
          tsundereLevel: 20,
          shyness: 60,
        },
      };

      expect(validateCharacterData(invalidCharacter as any)).toBe(false);
    });

    it('should handle missing required fields', () => {
      const incompleteCharacter = {
        id: 'aoi',
        name: '蒼',
        // Missing age and other required fields
      };

      expect(validateCharacterData(incompleteCharacter as any)).toBe(false);
    });
  });

  describe('validateUserProfile', () => {
    it('should validate correct user profile', () => {
      const validProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() - 86400000),
        lastActiveAt: new Date(Date.now()),
      };

      expect(validateUserProfile(validProfile)).toBe(true);
    });

    it('should reject invalid user profile', () => {
      const invalidProfile = {
        id: '', // Invalid empty id
        name: '',
        email: 'invalid-email', // Invalid email format
        avatar: 'avatar.jpg',
        createdAt: Date.now() - 86400000,
        lastActiveAt: Date.now(),
      };

      expect(validateUserProfile(invalidProfile as any)).toBe(false);
    });

    it('should handle future timestamps', () => {
      const invalidProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        createdAt: new Date(Date.now() + 86400000), // Future timestamp
        lastActiveAt: new Date(Date.now()),
      };

      expect(validateUserProfile(invalidProfile)).toBe(false);
    });
  });

  describe('validateUserPreferences', () => {
    it('should validate correct user preferences', () => {
      const validPreferences = {
        theme: 'dark',
        language: 'ja',
        voiceEnabled: true,
        notificationsEnabled: false,
        autoSave: true,
        fontSize: 'large',
        animationSpeed: 'fast',
      };

      expect(validateUserPreferences(validPreferences)).toBe(true);
    });

    it('should reject invalid user preferences', () => {
      const invalidPreferences = {
        theme: 'invalid-theme', // Invalid theme
        language: 'xx', // Invalid language code
        voiceEnabled: 'not-boolean', // Invalid boolean
        notificationsEnabled: true,
        autoSave: true,
        fontSize: 'medium',
        animationSpeed: 'normal',
      };

      expect(validateUserPreferences(invalidPreferences as any)).toBe(false);
    });
  });

  describe('validateDialogueMessage', () => {
    it('should validate correct dialogue message', () => {
      const validMessage: DialogueMessage = {
        id: 'msg-123',
        text: 'Hello world',
        sender: 'user',
        timestamp: Date.now(),
        emotion: 'neutral',
      };

      expect(validateDialogueMessage(validMessage)).toBe(true);
    });

    it('should reject invalid dialogue message', () => {
      const invalidMessage = {
        id: '', // Invalid empty id
        text: '', // Invalid empty text
        sender: 'invalid-sender', // Invalid sender
        timestamp: -1, // Invalid timestamp
        emotion: 'invalid-emotion', // Invalid emotion
      };

      expect(validateDialogueMessage(invalidMessage as any)).toBe(false);
    });

    it('should handle missing optional fields', () => {
      const messageWithoutOptional: DialogueMessage = {
        id: 'msg-123',
        text: 'Hello world',
        sender: 'user',
        timestamp: Date.now(),
        emotion: 'neutral',
      };

      expect(validateDialogueMessage(messageWithoutOptional)).toBe(true);
    });
  });

  describe('validateVoiceSettings', () => {
    it('should validate correct voice settings', () => {
      const validSettings: VoiceSettings = {
        pitch: 75,
        tone: 'clear_young_male',
        speed: 1.0,
        emotionalRange: 80,
        voiceId: 'ja-JP-KeitaNeural',
      };

      expect(validateVoiceSettings(validSettings)).toBe(true);
    });

    it('should reject invalid voice settings', () => {
      const invalidSettings = {
        pitch: 150, // Invalid range
        tone: '', // Invalid empty tone
        speed: 5.0, // Invalid range
        emotionalRange: -10, // Invalid range
        voiceId: '', // Invalid empty voiceId
      };

      expect(validateVoiceSettings(invalidSettings as any)).toBe(false);
    });
  });

  describe('validatePersonalityTraits', () => {
    it('should validate correct personality traits', () => {
      const validTraits: PersonalityTraits = {
        aggressiveness: 30,
        kindness: 85,
        tsundereLevel: 20,
        shyness: 60,
      };

      expect(validatePersonalityTraits(validTraits)).toBe(true);
    });

    it('should reject invalid personality traits', () => {
      const invalidTraits = {
        aggressiveness: 150, // Invalid range
        kindness: -10, // Invalid range
        tsundereLevel: 20,
        shyness: 60,
      };

      expect(validatePersonalityTraits(invalidTraits as any)).toBe(false);
    });
  });

  describe('validateAppearanceSettings', () => {
    it('should validate correct appearance settings', () => {
      const validAppearance: AppearanceSettings = {
        hairColor: '#4A90E2',
        eyeColor: '#2E5BBA',
        clothing: {
          id: 'casual_01',
          name: 'Casual Shirt',
          category: 'casual',
          imageUrl: '/assets/clothing/casual_01.png',
        },
        expressions: {
          neutral: '/assets/expressions/neutral.png',
          happy: '/assets/expressions/happy.png',
          sad: '/assets/expressions/sad.png',
          angry: '/assets/expressions/angry.png',
          surprised: '/assets/expressions/surprised.png',
          embarrassed: '/assets/expressions/embarrassed.png',
        },
      };

      expect(validateAppearanceSettings(validAppearance)).toBe(true);
    });

    it('should reject invalid appearance settings', () => {
      const invalidAppearance = {
        hairColor: 'invalid-color', // Invalid color format
        eyeColor: '#2E5BBA',
        clothing: {
          id: '', // Invalid empty id
          name: 'Casual Shirt',
          category: 'invalid-category', // Invalid category
          imageUrl: '/assets/clothing/casual_01.png',
        },
        expressions: {
          neutral: '/assets/expressions/neutral.png',
          // Missing required expressions
        },
      };

      expect(validateAppearanceSettings(invalidAppearance as any)).toBe(false);
    });
  });

  describe('validateDialogueScenario', () => {
    it('should validate correct dialogue scenario', () => {
      const validScenario: DialogueScenario = {
        id: 'daily_conversation',
        category: 'daily',
        title: 'Daily Chat',
        description: 'Normal conversation',
        initialPrompt: 'Hello',
        tags: ['casual', 'friendly'],
        difficulty: 'easy',
      };

      expect(validateDialogueScenario(validScenario)).toBe(true);
    });

    it('should reject invalid dialogue scenario', () => {
      const invalidScenario = {
        id: '', // Invalid empty id
        category: 'invalid-category', // Invalid category
        title: '',
        description: 'Normal conversation',
        initialPrompt: '',
        tags: [], // Invalid empty tags
        difficulty: 'invalid-difficulty', // Invalid difficulty
      };

      expect(validateDialogueScenario(invalidScenario as any)).toBe(false);
    });
  });

  describe('validateRelationshipSettings', () => {
    it('should validate correct relationship settings', () => {
      const validSettings: RelationshipSettings = {
        type: 'childhood-friends',
        intimacyLevel: 75,
        trustLevel: 80,
      };

      expect(validateRelationshipSettings(validSettings)).toBe(true);
    });

    it('should reject invalid relationship settings', () => {
      const invalidSettings = {
        type: 'invalid-type', // Invalid type
        intimacyLevel: 150, // Invalid range
        trustLevel: -10, // Invalid range
      };

      expect(validateRelationshipSettings(invalidSettings as any)).toBe(false);
    });
  });

  describe('isValidCharacterType', () => {
    it('should validate character types', () => {
      expect(isValidCharacterType('aoi')).toBe(true);
      expect(isValidCharacterType('shun')).toBe(true);
      expect(isValidCharacterType('invalid')).toBe(false);
      expect(isValidCharacterType('')).toBe(false);
    });
  });

  describe('isValidEmotionState', () => {
    it('should validate emotion states', () => {
      expect(isValidEmotionState('neutral')).toBe(true);
      expect(isValidEmotionState('happy')).toBe(true);
      expect(isValidEmotionState('sad')).toBe(true);
      expect(isValidEmotionState('angry')).toBe(true);
      expect(isValidEmotionState('surprised')).toBe(true);
      expect(isValidEmotionState('embarrassed')).toBe(true);
      expect(isValidEmotionState('invalid')).toBe(false);
    });
  });

  describe('isValidPlaybackState', () => {
    it('should validate playback states', () => {
      expect(isValidPlaybackState('playing')).toBe(true);
      expect(isValidPlaybackState('paused')).toBe(true);
      expect(isValidPlaybackState('stopped')).toBe(true);
      expect(isValidPlaybackState('invalid')).toBe(false);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize user input', () => {
      expect(sanitizeUserInput('  Hello World  ')).toBe('Hello World');
      expect(sanitizeUserInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeUserInput('Normal text')).toBe('Normal text');
    });

    it('should handle empty input', () => {
      expect(sanitizeUserInput('')).toBe('');
      expect(sanitizeUserInput('   ')).toBe('');
    });

    it('should handle special characters', () => {
      expect(sanitizeUserInput('Hello & World')).toBe('Hello & World');
      expect(sanitizeUserInput('Price: $100')).toBe('Price: $100');
    });
  });

  describe('validateApiResponse', () => {
    it('should validate correct API response', () => {
      const validResponse = {
        success: true,
        data: {
          id: 'test-123',
          name: 'Test',
        },
        message: 'Success',
      };

      expect(validateApiResponse(validResponse)).toBe(true);
    });

    it('should reject invalid API response', () => {
      const invalidResponse = {
        success: 'not-boolean', // Invalid boolean
        data: null,
        // Missing message
      };

      expect(validateApiResponse(invalidResponse as any)).toBe(false);
    });

    it('should handle missing data', () => {
      const responseWithoutData = {
        success: true,
        message: 'Success',
      };

      expect(validateApiResponse(responseWithoutData)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      expect(validateCharacterData(null as any)).toBe(false);
      expect(validateUserProfile(null as any)).toBe(false);
      expect(validateUserPreferences(null as any)).toBe(false);
    });

    it('should handle undefined values', () => {
      expect(validateCharacterData(undefined as any)).toBe(false);
      expect(validateUserProfile(undefined as any)).toBe(false);
      expect(validateUserPreferences(undefined as any)).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(validateCharacterData({} as any)).toBe(false);
      expect(validateUserProfile({} as any)).toBe(false);
      expect(validateUserPreferences({} as any)).toBe(false);
    });

    it('should handle arrays instead of objects', () => {
      expect(validateCharacterData([] as any)).toBe(false);
      expect(validateUserProfile([] as any)).toBe(false);
      expect(validateUserPreferences([] as any)).toBe(false);
    });
  });

  describe('boundary values', () => {
    it('should handle boundary values for personality traits', () => {
      const minTraits: PersonalityTraits = {
        aggressiveness: 0,
        kindness: 0,
        tsundereLevel: 0,
        shyness: 0,
      };

      const maxTraits: PersonalityTraits = {
        aggressiveness: 100,
        kindness: 100,
        tsundereLevel: 100,
        shyness: 100,
      };

      expect(validatePersonalityTraits(minTraits)).toBe(true);
      expect(validatePersonalityTraits(maxTraits)).toBe(true);
    });

    it('should handle boundary values for voice settings', () => {
      const minSettings: VoiceSettings = {
        pitch: 0,
        tone: 'test',
        speed: 0.5,
        emotionalRange: 0,
        voiceId: 'test',
      };

      const maxSettings: VoiceSettings = {
        pitch: 100,
        tone: 'test',
        speed: 2.0,
        emotionalRange: 100,
        voiceId: 'test',
      };

      expect(validateVoiceSettings(minSettings)).toBe(true);
      expect(validateVoiceSettings(maxSettings)).toBe(true);
    });
  });
});