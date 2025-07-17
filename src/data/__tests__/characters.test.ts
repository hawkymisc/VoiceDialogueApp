import {
  DEFAULT_CHARACTERS,
  getCharacterById,
  getAllCharacters,
  isValidCharacterType,
} from '../characters';
import {CharacterType} from '../../types/Character';

describe('characters data', () => {
  describe('DEFAULT_CHARACTERS', () => {
    it('should contain both aoi and shun characters', () => {
      expect(DEFAULT_CHARACTERS).toHaveProperty('aoi');
      expect(DEFAULT_CHARACTERS).toHaveProperty('shun');
    });

    it('should have correct character data for aoi', () => {
      const aoi = DEFAULT_CHARACTERS.aoi;
      expect(aoi.name).toBe('蒼');
      expect(aoi.age).toBe(22);
      expect(aoi.id).toBe('aoi');
      expect(aoi.personality.kindness).toBe(85);
      expect(aoi.voiceSettings.pitch).toBe(75);
    });

    it('should have correct character data for shun', () => {
      const shun = DEFAULT_CHARACTERS.shun;
      expect(shun.name).toBe('瞬');
      expect(shun.age).toBe(35);
      expect(shun.id).toBe('shun');
      expect(shun.personality.kindness).toBe(75);
      expect(shun.voiceSettings.pitch).toBe(35);
    });

    it('should have valid personality traits within range', () => {
      Object.values(DEFAULT_CHARACTERS).forEach(character => {
        expect(character.personality.aggressiveness).toBeGreaterThanOrEqual(0);
        expect(character.personality.aggressiveness).toBeLessThanOrEqual(100);
        expect(character.personality.kindness).toBeGreaterThanOrEqual(0);
        expect(character.personality.kindness).toBeLessThanOrEqual(100);
        expect(character.personality.tsundereLevel).toBeGreaterThanOrEqual(0);
        expect(character.personality.tsundereLevel).toBeLessThanOrEqual(100);
        expect(character.personality.shyness).toBeGreaterThanOrEqual(0);
        expect(character.personality.shyness).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid voice settings', () => {
      Object.values(DEFAULT_CHARACTERS).forEach(character => {
        expect(character.voiceSettings.pitch).toBeGreaterThanOrEqual(0);
        expect(character.voiceSettings.pitch).toBeLessThanOrEqual(100);
        expect(character.voiceSettings.speed).toBeGreaterThan(0);
        expect(character.voiceSettings.emotionalRange).toBeGreaterThanOrEqual(
          0,
        );
        expect(character.voiceSettings.emotionalRange).toBeLessThanOrEqual(100);
        expect(character.voiceSettings.voiceId).toBeTruthy();
      });
    });
  });

  describe('getCharacterById', () => {
    it('should return correct character for aoi', () => {
      const character = getCharacterById('aoi');
      expect(character).toEqual(DEFAULT_CHARACTERS.aoi);
    });

    it('should return correct character for shun', () => {
      const character = getCharacterById('shun');
      expect(character).toEqual(DEFAULT_CHARACTERS.shun);
    });
  });

  describe('getAllCharacters', () => {
    it('should return array of all characters', () => {
      const characters = getAllCharacters();
      expect(characters).toHaveLength(2);
      expect(characters).toContain(DEFAULT_CHARACTERS.aoi);
      expect(characters).toContain(DEFAULT_CHARACTERS.shun);
    });
  });

  describe('isValidCharacterType', () => {
    it('should return true for valid character types', () => {
      expect(isValidCharacterType('aoi')).toBe(true);
      expect(isValidCharacterType('shun')).toBe(true);
    });

    it('should return false for invalid character types', () => {
      expect(isValidCharacterType('invalid')).toBe(false);
      expect(isValidCharacterType('')).toBe(false);
      expect(isValidCharacterType('AOI')).toBe(false);
      expect(isValidCharacterType('SHUN')).toBe(false);
    });
  });
});
