import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  Character,
  CharacterState,
  CharacterType,
  CharacterCustomization,
  RelationshipSettings,
} from '../../types/Character';
import {
  DEFAULT_CHARACTERS,
  DEFAULT_RELATIONSHIP,
  createRelationshipSettings,
} from '../../data/characters';

// Initial state with default characters
const initialState: CharacterState = {
  characters: DEFAULT_CHARACTERS,
  activeCharacter: 'aoi', // Default to 蒼 (Aoi)
  relationship: DEFAULT_RELATIONSHIP,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCharacters = createAsyncThunk(
  'character/fetchCharacters',
  async (_, {rejectWithValue}) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const updateCharacterCustomization = createAsyncThunk(
  'character/updateCustomization',
  async (customization: CharacterCustomization, {rejectWithValue}) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch(
        `/api/characters/${customization.characterId}/customize`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customization),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to update character customization');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

// Character slice
export const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setActiveCharacter: (state, action: PayloadAction<CharacterType>) => {
      state.activeCharacter = action.payload;
    },
    clearActiveCharacter: state => {
      state.activeCharacter = null;
    },
    updateCharacterPersonality: (
      state,
      action: PayloadAction<{
        characterId: CharacterType;
        personality: Partial<Character['personality']>;
      }>,
    ) => {
      const {characterId, personality} = action.payload;
      if (state.characters[characterId]) {
        state.characters[characterId].personality = {
          ...state.characters[characterId].personality,
          ...personality,
        };
      }
    },
    updateCharacterAppearance: (
      state,
      action: PayloadAction<{
        characterId: CharacterType;
        appearance: Partial<Character['appearance']>;
      }>,
    ) => {
      const {characterId, appearance} = action.payload;
      if (state.characters[characterId]) {
        state.characters[characterId].appearance = {
          ...state.characters[characterId].appearance,
          ...appearance,
        };
      }
    },
    updateCharacterVoiceSettings: (
      state,
      action: PayloadAction<{
        characterId: CharacterType;
        voiceSettings: Partial<Character['voiceSettings']>;
      }>,
    ) => {
      const {characterId, voiceSettings} = action.payload;
      if (state.characters[characterId]) {
        state.characters[characterId].voiceSettings = {
          ...state.characters[characterId].voiceSettings,
          ...voiceSettings,
        };
      }
    },
    resetCharacterCustomization: (
      state,
      action: PayloadAction<CharacterType>,
    ) => {
      const characterId = action.payload;
      if (state.characters[characterId] && DEFAULT_CHARACTERS[characterId]) {
        // Reset to default character data
        state.characters[characterId] = {...DEFAULT_CHARACTERS[characterId]};
      }
    },
    switchCharacter: (state, action: PayloadAction<CharacterType>) => {
      // Switch active character with validation
      const newCharacter = action.payload;
      if (state.characters[newCharacter]) {
        state.activeCharacter = newCharacter;
      }
    },
    initializeCharacters: state => {
      // Initialize or reset all characters to default state
      state.characters = {...DEFAULT_CHARACTERS};
      if (!state.activeCharacter || !state.characters[state.activeCharacter]) {
        state.activeCharacter = 'aoi';
      }
    },
    clearError: state => {
      state.error = null;
    },
    // Relationship management actions
    setRelationshipType: (
      state,
      action: PayloadAction<RelationshipSettings['type']>,
    ) => {
      state.relationship = createRelationshipSettings(action.payload);
    },
    updateRelationshipSettings: (
      state,
      action: PayloadAction<Partial<RelationshipSettings>>,
    ) => {
      state.relationship = {
        ...state.relationship,
        ...action.payload,
      };
    },
    resetRelationship: state => {
      state.relationship = DEFAULT_RELATIONSHIP;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch characters
      .addCase(fetchCharacters.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update character customization
      .addCase(updateCharacterCustomization.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCharacterCustomization.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCharacter = action.payload;
        const characterType = updatedCharacter.id as CharacterType;
        if (characterType && state.characters[characterType]) {
          state.characters[characterType] = updatedCharacter;
        }
      })
      .addCase(updateCharacterCustomization.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveCharacter,
  clearActiveCharacter,
  updateCharacterPersonality,
  updateCharacterAppearance,
  updateCharacterVoiceSettings,
  resetCharacterCustomization,
  switchCharacter,
  initializeCharacters,
  clearError,
  setRelationshipType,
  updateRelationshipSettings,
  resetRelationship,
} = characterSlice.actions;

// Selectors
export const selectCharacters = (state: {character: CharacterState}) =>
  state.character.characters;
export const selectActiveCharacter = (state: {character: CharacterState}) =>
  state.character.activeCharacter;
export const selectActiveCharacterData = (state: {
  character: CharacterState;
}) => {
  const activeId = state.character.activeCharacter;
  return activeId ? state.character.characters[activeId] : null;
};
export const selectCharacterById = (
  state: {character: CharacterState},
  characterId: CharacterType,
) => state.character.characters[characterId];
export const selectCharacterLoading = (state: {character: CharacterState}) =>
  state.character.isLoading;
export const selectCharacterError = (state: {character: CharacterState}) =>
  state.character.error;

// Relationship selectors
export const selectRelationshipSettings = (state: {
  character: CharacterState;
}) => state.character.relationship;
export const selectRelationshipType = (state: {character: CharacterState}) =>
  state.character.relationship.type;
export const selectIntimacyLevel = (state: {character: CharacterState}) =>
  state.character.relationship.intimacyLevel;
export const selectTrustLevel = (state: {character: CharacterState}) =>
  state.character.relationship.trustLevel;

export default characterSlice.reducer;
