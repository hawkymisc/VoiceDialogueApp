import characterReducer, {
  setActiveCharacter,
  clearActiveCharacter,
  updateCharacterPersonality,
  updateCharacterAppearance,
  updateCharacterVoiceSettings,
  resetCharacterCustomization,
  switchCharacter,
  initializeCharacters,
  clearError,
  selectCharacters,
  selectActiveCharacter,
  selectActiveCharacterData,
  selectCharacterById,
} from '../characterSlice';
import {CharacterState, CharacterType} from '../../../types/Character';
import {
  DEFAULT_CHARACTERS,
  DEFAULT_RELATIONSHIP,
} from '../../../data/characters';

describe('characterSlice', () => {
  const initialState: CharacterState = {
    characters: DEFAULT_CHARACTERS,
    activeCharacter: 'aoi',
    relationship: DEFAULT_RELATIONSHIP,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(characterReducer(undefined, {type: 'unknown'})).toEqual(
      initialState,
    );
  });

  describe('setActiveCharacter', () => {
    it('should set the active character', () => {
      const actual = characterReducer(initialState, setActiveCharacter('shun'));
      expect(actual.activeCharacter).toEqual('shun');
    });
  });

  describe('clearActiveCharacter', () => {
    it('should clear the active character', () => {
      const state = {...initialState, activeCharacter: 'shun' as CharacterType};
      const actual = characterReducer(state, clearActiveCharacter());
      expect(actual.activeCharacter).toBeNull();
    });
  });

  describe('switchCharacter', () => {
    it('should switch to a valid character', () => {
      const actual = characterReducer(initialState, switchCharacter('shun'));
      expect(actual.activeCharacter).toEqual('shun');
    });

    it('should not switch to invalid character', () => {
      const actual = characterReducer(initialState, switchCharacter('aoi'));
      expect(actual.activeCharacter).toEqual('aoi');
    });
  });

  describe('updateCharacterPersonality', () => {
    it('should update character personality traits', () => {
      const personalityUpdate = {kindness: 90, aggressiveness: 40};
      const actual = characterReducer(
        initialState,
        updateCharacterPersonality({
          characterId: 'aoi',
          personality: personalityUpdate,
        }),
      );

      expect(actual.characters.aoi.personality.kindness).toEqual(90);
      expect(actual.characters.aoi.personality.aggressiveness).toEqual(40);
      // Other traits should remain unchanged
      expect(actual.characters.aoi.personality.tsundereLevel).toEqual(
        DEFAULT_CHARACTERS.aoi.personality.tsundereLevel,
      );
    });
  });

  describe('updateCharacterAppearance', () => {
    it('should update character appearance settings', () => {
      const appearanceUpdate = {hairColor: '#FF0000'};
      const actual = characterReducer(
        initialState,
        updateCharacterAppearance({
          characterId: 'shun',
          appearance: appearanceUpdate,
        }),
      );

      expect(actual.characters.shun.appearance.hairColor).toEqual('#FF0000');
      // Other appearance settings should remain unchanged
      expect(actual.characters.shun.appearance.eyeColor).toEqual(
        DEFAULT_CHARACTERS.shun.appearance.eyeColor,
      );
    });
  });

  describe('updateCharacterVoiceSettings', () => {
    it('should update character voice settings', () => {
      const voiceUpdate = {pitch: 80, speed: 1.2};
      const actual = characterReducer(
        initialState,
        updateCharacterVoiceSettings({
          characterId: 'aoi',
          voiceSettings: voiceUpdate,
        }),
      );

      expect(actual.characters.aoi.voiceSettings.pitch).toEqual(80);
      expect(actual.characters.aoi.voiceSettings.speed).toEqual(1.2);
      // Other voice settings should remain unchanged
      expect(actual.characters.aoi.voiceSettings.tone).toEqual(
        DEFAULT_CHARACTERS.aoi.voiceSettings.tone,
      );
    });
  });

  describe('resetCharacterCustomization', () => {
    it('should reset character to default values', () => {
      // First modify a character
      const modifiedState = characterReducer(
        initialState,
        updateCharacterPersonality({
          characterId: 'aoi',
          personality: {kindness: 50},
        }),
      );

      // Then reset it
      const actual = characterReducer(
        modifiedState,
        resetCharacterCustomization('aoi'),
      );

      expect(actual.characters.aoi).toEqual(DEFAULT_CHARACTERS.aoi);
    });
  });

  describe('initializeCharacters', () => {
    it('should initialize characters to default state', () => {
      const modifiedState: CharacterState = {
        ...initialState,
        characters: {
          aoi: {...DEFAULT_CHARACTERS.aoi, name: 'Modified'},
          shun: {...DEFAULT_CHARACTERS.shun, name: 'Modified'},
        },
      };

      const actual = characterReducer(modifiedState, initializeCharacters());

      expect(actual.characters).toEqual(DEFAULT_CHARACTERS);
      expect(actual.activeCharacter).toEqual('aoi');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const stateWithError = {...initialState, error: 'Some error'};
      const actual = characterReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      character: initialState,
    };

    it('selectCharacters should return all characters', () => {
      expect(selectCharacters(mockState)).toEqual(DEFAULT_CHARACTERS);
    });

    it('selectActiveCharacter should return active character id', () => {
      expect(selectActiveCharacter(mockState)).toEqual('aoi');
    });

    it('selectActiveCharacterData should return active character data', () => {
      expect(selectActiveCharacterData(mockState)).toEqual(
        DEFAULT_CHARACTERS.aoi,
      );
    });

    it('selectActiveCharacterData should return null when no active character', () => {
      const stateWithoutActive = {
        character: {...initialState, activeCharacter: null},
      };
      expect(selectActiveCharacterData(stateWithoutActive)).toBeNull();
    });

    it('selectCharacterById should return specific character', () => {
      expect(selectCharacterById(mockState, 'shun')).toEqual(
        DEFAULT_CHARACTERS.shun,
      );
    });
  });
});
