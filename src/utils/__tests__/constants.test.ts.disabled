import {
  EMOTION_STATES,
  DIALOGUE_CATEGORIES,
  RELATIONSHIP_TYPES,
  VOICE_TONES,
  THEME_COLORS,
  ANIMATION_SPEEDS,
  FONT_SIZES,
  SUPPORTED_LANGUAGES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  AUDIO_FORMATS,
  CLOTHING_CATEGORIES,
  DIFFICULTY_LEVELS,
  PERSONALITY_TRAITS,
  VOICE_SETTINGS_RANGES,
  CHARACTER_AGES,
  DIALOGUE_LIMITS,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_VALUES,
} from '../constants';

describe('constants', () => {
  describe('EMOTION_STATES', () => {
    it('should contain all required emotion states', () => {
      expect(EMOTION_STATES).toContain('neutral');
      expect(EMOTION_STATES).toContain('happy');
      expect(EMOTION_STATES).toContain('sad');
      expect(EMOTION_STATES).toContain('angry');
      expect(EMOTION_STATES).toContain('surprised');
      expect(EMOTION_STATES).toContain('embarrassed');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(EMOTION_STATES)).toBe(true);
      EMOTION_STATES.forEach(state => {
        expect(typeof state).toBe('string');
      });
    });
  });

  describe('DIALOGUE_CATEGORIES', () => {
    it('should contain all required dialogue categories', () => {
      expect(DIALOGUE_CATEGORIES).toContain('daily');
      expect(DIALOGUE_CATEGORIES).toContain('work');
      expect(DIALOGUE_CATEGORIES).toContain('romance');
      expect(DIALOGUE_CATEGORIES).toContain('comedy');
      expect(DIALOGUE_CATEGORIES).toContain('drama');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(DIALOGUE_CATEGORIES)).toBe(true);
      DIALOGUE_CATEGORIES.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });
  });

  describe('RELATIONSHIP_TYPES', () => {
    it('should contain all required relationship types', () => {
      expect(RELATIONSHIP_TYPES).toContain('strangers');
      expect(RELATIONSHIP_TYPES).toContain('senpai-kohai');
      expect(RELATIONSHIP_TYPES).toContain('boss-subordinate');
      expect(RELATIONSHIP_TYPES).toContain('childhood-friends');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(RELATIONSHIP_TYPES)).toBe(true);
      RELATIONSHIP_TYPES.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('VOICE_TONES', () => {
    it('should contain required voice tones', () => {
      expect(VOICE_TONES).toContain('clear_young_male');
      expect(VOICE_TONES).toContain('mature_male');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(VOICE_TONES)).toBe(true);
      VOICE_TONES.forEach(tone => {
        expect(typeof tone).toBe('string');
      });
    });
  });

  describe('THEME_COLORS', () => {
    it('should contain light and dark themes', () => {
      expect(THEME_COLORS).toHaveProperty('light');
      expect(THEME_COLORS).toHaveProperty('dark');
    });

    it('should have required color properties', () => {
      const themes = ['light', 'dark'];
      themes.forEach(theme => {
        expect(THEME_COLORS[theme]).toHaveProperty('primary');
        expect(THEME_COLORS[theme]).toHaveProperty('secondary');
        expect(THEME_COLORS[theme]).toHaveProperty('background');
        expect(THEME_COLORS[theme]).toHaveProperty('text');
      });
    });

    it('should have valid hex color values', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;
      Object.values(THEME_COLORS).forEach(theme => {
        Object.values(theme).forEach(color => {
          expect(typeof color).toBe('string');
          expect(hexPattern.test(color)).toBe(true);
        });
      });
    });
  });

  describe('ANIMATION_SPEEDS', () => {
    it('should contain all animation speeds', () => {
      expect(ANIMATION_SPEEDS).toContain('slow');
      expect(ANIMATION_SPEEDS).toContain('normal');
      expect(ANIMATION_SPEEDS).toContain('fast');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(ANIMATION_SPEEDS)).toBe(true);
      ANIMATION_SPEEDS.forEach(speed => {
        expect(typeof speed).toBe('string');
      });
    });
  });

  describe('FONT_SIZES', () => {
    it('should contain all font sizes', () => {
      expect(FONT_SIZES).toContain('small');
      expect(FONT_SIZES).toContain('medium');
      expect(FONT_SIZES).toContain('large');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(FONT_SIZES)).toBe(true);
      FONT_SIZES.forEach(size => {
        expect(typeof size).toBe('string');
      });
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain Japanese language', () => {
      expect(SUPPORTED_LANGUAGES).toContain('ja');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBe(2); // ISO language codes
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should contain all required endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('DIALOGUE');
      expect(API_ENDPOINTS).toHaveProperty('TTS');
      expect(API_ENDPOINTS).toHaveProperty('USER');
      expect(API_ENDPOINTS).toHaveProperty('SCENARIOS');
    });

    it('should have valid URL paths', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        expect(typeof endpoint).toBe('string');
        expect(endpoint.startsWith('/')).toBe(true);
      });
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should contain all required storage keys', () => {
      expect(STORAGE_KEYS).toHaveProperty('USER_PROFILE');
      expect(STORAGE_KEYS).toHaveProperty('USER_PREFERENCES');
      expect(STORAGE_KEYS).toHaveProperty('FAVORITE_CHARACTERS');
      expect(STORAGE_KEYS).toHaveProperty('DIALOGUE_HISTORY');
    });

    it('should be strings', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AUDIO_FORMATS', () => {
    it('should contain supported audio formats', () => {
      expect(AUDIO_FORMATS).toContain('mp3');
      expect(AUDIO_FORMATS).toContain('wav');
      expect(AUDIO_FORMATS).toContain('ogg');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(AUDIO_FORMATS)).toBe(true);
      AUDIO_FORMATS.forEach(format => {
        expect(typeof format).toBe('string');
      });
    });
  });

  describe('CLOTHING_CATEGORIES', () => {
    it('should contain all clothing categories', () => {
      expect(CLOTHING_CATEGORIES).toContain('casual');
      expect(CLOTHING_CATEGORIES).toContain('formal');
      expect(CLOTHING_CATEGORIES).toContain('special');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(CLOTHING_CATEGORIES)).toBe(true);
      CLOTHING_CATEGORIES.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });
  });

  describe('DIFFICULTY_LEVELS', () => {
    it('should contain all difficulty levels', () => {
      expect(DIFFICULTY_LEVELS).toContain('easy');
      expect(DIFFICULTY_LEVELS).toContain('medium');
      expect(DIFFICULTY_LEVELS).toContain('hard');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(DIFFICULTY_LEVELS)).toBe(true);
      DIFFICULTY_LEVELS.forEach(level => {
        expect(typeof level).toBe('string');
      });
    });
  });

  describe('PERSONALITY_TRAITS', () => {
    it('should contain all personality traits', () => {
      expect(PERSONALITY_TRAITS).toContain('aggressiveness');
      expect(PERSONALITY_TRAITS).toContain('kindness');
      expect(PERSONALITY_TRAITS).toContain('tsundereLevel');
      expect(PERSONALITY_TRAITS).toContain('shyness');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(PERSONALITY_TRAITS)).toBe(true);
      PERSONALITY_TRAITS.forEach(trait => {
        expect(typeof trait).toBe('string');
      });
    });
  });

  describe('VOICE_SETTINGS_RANGES', () => {
    it('should contain all voice setting ranges', () => {
      expect(VOICE_SETTINGS_RANGES).toHaveProperty('pitch');
      expect(VOICE_SETTINGS_RANGES).toHaveProperty('speed');
      expect(VOICE_SETTINGS_RANGES).toHaveProperty('emotionalRange');
    });

    it('should have valid min and max values', () => {
      Object.values(VOICE_SETTINGS_RANGES).forEach(range => {
        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.min).toBeLessThan(range.max);
      });
    });
  });

  describe('CHARACTER_AGES', () => {
    it('should contain character ages', () => {
      expect(CHARACTER_AGES).toHaveProperty('aoi');
      expect(CHARACTER_AGES).toHaveProperty('shun');
    });

    it('should have valid age values', () => {
      Object.values(CHARACTER_AGES).forEach(age => {
        expect(typeof age).toBe('number');
        expect(age).toBeGreaterThan(0);
        expect(age).toBeLessThan(100);
      });
    });
  });

  describe('DIALOGUE_LIMITS', () => {
    it('should contain dialogue limits', () => {
      expect(DIALOGUE_LIMITS).toHaveProperty('MAX_MESSAGE_LENGTH');
      expect(DIALOGUE_LIMITS).toHaveProperty('MAX_DIALOGUE_DURATION');
      expect(DIALOGUE_LIMITS).toHaveProperty('MAX_HISTORY_ENTRIES');
    });

    it('should have valid numeric values', () => {
      Object.values(DIALOGUE_LIMITS).forEach(limit => {
        expect(typeof limit).toBe('number');
        expect(limit).toBeGreaterThan(0);
      });
    });
  });

  describe('VALIDATION_PATTERNS', () => {
    it('should contain validation patterns', () => {
      expect(VALIDATION_PATTERNS).toHaveProperty('EMAIL');
      expect(VALIDATION_PATTERNS).toHaveProperty('URL');
      expect(VALIDATION_PATTERNS).toHaveProperty('HEX_COLOR');
    });

    it('should be valid regex patterns', () => {
      Object.values(VALIDATION_PATTERNS).forEach(pattern => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });

    it('should validate correct formats', () => {
      expect(VALIDATION_PATTERNS.EMAIL.test('test@example.com')).toBe(true);
      expect(VALIDATION_PATTERNS.EMAIL.test('invalid-email')).toBe(false);

      expect(VALIDATION_PATTERNS.URL.test('https://example.com')).toBe(true);
      expect(VALIDATION_PATTERNS.URL.test('invalid-url')).toBe(false);

      expect(VALIDATION_PATTERNS.HEX_COLOR.test('#FF0000')).toBe(true);
      expect(VALIDATION_PATTERNS.HEX_COLOR.test('invalid-color')).toBe(false);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should contain error messages', () => {
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_EMAIL');
      expect(ERROR_MESSAGES).toHaveProperty('NETWORK_ERROR');
      expect(ERROR_MESSAGES).toHaveProperty('VALIDATION_ERROR');
    });

    it('should be strings', () => {
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should contain success messages', () => {
      expect(SUCCESS_MESSAGES).toHaveProperty('PROFILE_UPDATED');
      expect(SUCCESS_MESSAGES).toHaveProperty('PREFERENCES_SAVED');
      expect(SUCCESS_MESSAGES).toHaveProperty('DIALOGUE_SAVED');
    });

    it('should be strings', () => {
      Object.values(SUCCESS_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_VALUES', () => {
    it('should contain default values', () => {
      expect(DEFAULT_VALUES).toHaveProperty('VOLUME');
      expect(DEFAULT_VALUES).toHaveProperty('SPEED');
      expect(DEFAULT_VALUES).toHaveProperty('THEME');
      expect(DEFAULT_VALUES).toHaveProperty('LANGUAGE');
    });

    it('should have appropriate types', () => {
      expect(typeof DEFAULT_VALUES.VOLUME).toBe('number');
      expect(typeof DEFAULT_VALUES.SPEED).toBe('number');
      expect(typeof DEFAULT_VALUES.THEME).toBe('string');
      expect(typeof DEFAULT_VALUES.LANGUAGE).toBe('string');
    });

    it('should have valid ranges', () => {
      expect(DEFAULT_VALUES.VOLUME).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_VALUES.VOLUME).toBeLessThanOrEqual(100);
      expect(DEFAULT_VALUES.SPEED).toBeGreaterThan(0);
      expect(SUPPORTED_LANGUAGES).toContain(DEFAULT_VALUES.LANGUAGE);
    });
  });

  describe('constant immutability', () => {
    it('should not allow modification of arrays', () => {
      const originalLength = EMOTION_STATES.length;
      
      // This should not modify the original array
      expect(() => {
        EMOTION_STATES.push('new_emotion');
      }).toThrow();
      
      expect(EMOTION_STATES.length).toBe(originalLength);
    });

    it('should not allow modification of objects', () => {
      const originalPrimary = THEME_COLORS.light.primary;
      
      // This should not modify the original object
      expect(() => {
        THEME_COLORS.light.primary = '#000000';
      }).toThrow();
      
      expect(THEME_COLORS.light.primary).toBe(originalPrimary);
    });
  });

  describe('constant consistency', () => {
    it('should have consistent naming conventions', () => {
      const constantNames = [
        'EMOTION_STATES',
        'DIALOGUE_CATEGORIES',
        'RELATIONSHIP_TYPES',
        'VOICE_TONES',
        'THEME_COLORS',
      ];

      constantNames.forEach(name => {
        expect(name).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should have consistent data types within arrays', () => {
      const stringArrays = [
        EMOTION_STATES,
        DIALOGUE_CATEGORIES,
        RELATIONSHIP_TYPES,
        VOICE_TONES,
        ANIMATION_SPEEDS,
        FONT_SIZES,
        SUPPORTED_LANGUAGES,
        AUDIO_FORMATS,
        CLOTHING_CATEGORIES,
        DIFFICULTY_LEVELS,
        PERSONALITY_TRAITS,
      ];

      stringArrays.forEach(array => {
        const firstType = typeof array[0];
        array.forEach(item => {
          expect(typeof item).toBe(firstType);
        });
      });
    });
  });
});