import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';
import type {RootState} from '../store';
import {
  DialogueState,
  DialogueMessage,
  EmotionState,
  DialogueScenario,
  Dialogue,
  DialogueHistoryEntry,
} from '../../types/Dialogue';
import {CharacterType} from '../../types/Character';
import {openaiService} from '../../services/openaiService';
import {historyService} from '../../services/historyService';

// Async thunk for generating dialogue response
export const generateDialogueResponse = createAsyncThunk(
  'dialogue/generateResponse',
  async (params: {
    characterId: CharacterType;
    userMessage: string;
    conversationHistory: DialogueMessage[];
    scenario?: DialogueScenario;
    relationshipContext?: string;
    personalityTraits?: Record<string, number>;
  }) => {
    const response = await openaiService.generateDialogue({
      characterId: params.characterId,
      userMessage: params.userMessage,
      conversationHistory: params.conversationHistory,
      scenario: params.scenario?.description,
      relationshipContext: params.relationshipContext,
      personalityTraits: params.personalityTraits,
    });
    return response;
  }
);

const initialState: DialogueState = {
  currentDialogue: null,
  dialogueHistory: [],
  emotionState: 'neutral',
  currentScenario: null,
  isLoading: false,
  error: null,
};

const dialogueSlice = createSlice({
  name: 'dialogue',
  initialState,
  reducers: {
    startDialogue: (state, action: PayloadAction<{
      characterId: CharacterType;
      scenario: DialogueScenario;
    }>) => {
      const {characterId, scenario} = action.payload;
      state.currentDialogue = {
        id: `dialogue-${Date.now()}`,
        characterId,
        scenario,
        messages: [],
        startTime: Date.now(),
        endTime: null,
        emotionProgression: ['neutral'],
      };
      state.currentScenario = scenario;
      state.emotionState = 'neutral';
      state.error = null;
    },

    endDialogue: (state) => {
      if (state.currentDialogue) {
        const endedDialogue = {
          ...state.currentDialogue,
          endTime: Date.now(),
        };

        // Add to history
        const historyEntry: DialogueHistoryEntry = {
          id: endedDialogue.id,
          characterId: endedDialogue.characterId,
          scenario: endedDialogue.scenario,
          startTime: endedDialogue.startTime,
          endTime: endedDialogue.endTime!,
          messageCount: endedDialogue.messages.length,
          emotionProgression: endedDialogue.emotionProgression,
        };

        state.dialogueHistory.unshift(historyEntry);
        
        // Save to persistent storage
        historyService.saveConversation(endedDialogue);
        historyService.addToHistory(historyEntry);
        
        state.currentDialogue = null;
        state.currentScenario = null;
      }
    },

    addMessage: (state, action: PayloadAction<DialogueMessage>) => {
      if (state.currentDialogue) {
        state.currentDialogue.messages.push(action.payload);
      }
    },

    updateEmotionState: (state, action: PayloadAction<EmotionState>) => {
      state.emotionState = action.payload;
      if (state.currentDialogue) {
        state.currentDialogue.emotionProgression.push(action.payload);
      }
    },

    setDialogueScenario: (state, action: PayloadAction<DialogueScenario>) => {
      state.currentScenario = action.payload;
    },

    setDialogueLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    clearDialogueError: (state) => {
      state.error = null;
    },

    clearDialogueHistory: (state) => {
      state.dialogueHistory = [];
      // Clear persistent storage
      historyService.clearAllHistory();
    },

    removeDialogueFromHistory: (state, action: PayloadAction<string>) => {
      state.dialogueHistory = state.dialogueHistory.filter(
        entry => entry.id !== action.payload
      );
      // Remove from persistent storage
      historyService.removeFromHistory(action.payload);
    },

    rateDialogue: (state, action: PayloadAction<{
      dialogueId: string;
      rating: number;
    }>) => {
      const {dialogueId, rating} = action.payload;
      const historyEntry = state.dialogueHistory.find(entry => entry.id === dialogueId);
      if (historyEntry) {
        historyEntry.rating = rating;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDialogueResponse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateDialogueResponse.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Add character response message
        if (state.currentDialogue) {
          const characterMessage: DialogueMessage = {
            id: `msg-${Date.now()}`,
            text: action.payload.text,
            sender: 'character',
            timestamp: Date.now(),
            emotion: action.payload.emotion,
            audioUrl: undefined, // Will be set by TTS service
          };
          
          state.currentDialogue.messages.push(characterMessage);
          state.emotionState = action.payload.emotion;
          state.currentDialogue.emotionProgression.push(action.payload.emotion);
        }
      })
      .addCase(generateDialogueResponse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to generate dialogue response';
      })
      .addCase(loadDialogueHistory.fulfilled, (state, action) => {
        state.dialogueHistory = action.payload;
      })
      .addCase(restoreConversation.fulfilled, (state, action) => {
        if (action.payload) {
          // Restore the conversation as current dialogue
          state.currentDialogue = {
            id: action.payload.id,
            characterId: action.payload.characterId,
            scenario: action.payload.scenario,
            messages: action.payload.messages,
            startTime: action.payload.startTime,
            endTime: action.payload.endTime,
            emotionProgression: action.payload.metadata.emotionProgression as EmotionState[],
          };
          state.currentScenario = action.payload.scenario;
          // Set emotion state to the last emotion in progression
          if (action.payload.metadata.emotionProgression.length > 0) {
            state.emotionState = action.payload.metadata.emotionProgression[
              action.payload.metadata.emotionProgression.length - 1
            ] as EmotionState;
          }
        }
      });
  },
});

// Async thunk for loading dialogue history on app start
export const loadDialogueHistory = createAsyncThunk(
  'dialogue/loadHistory',
  async () => {
    const history = await historyService.loadDialogueHistory();
    return history;
  }
);

// Async thunk for restoring a conversation from history
export const restoreConversation = createAsyncThunk(
  'dialogue/restoreConversation',
  async (conversationId: string) => {
    const conversation = await historyService.loadConversationById(conversationId);
    return conversation;
  }
);

export const {
  startDialogue,
  endDialogue,
  addMessage,
  updateEmotionState,
  setDialogueScenario,
  setDialogueLoading,
  clearDialogueError,
  clearDialogueHistory,
  removeDialogueFromHistory,
  rateDialogue,
} = dialogueSlice.actions;

// Selectors
export const selectDialogueState = (state: RootState) => state.dialogue;
export const selectCurrentDialogue = (state: RootState) => state.dialogue.currentDialogue;
export const selectDialogueHistory = (state: RootState) => state.dialogue.dialogueHistory;
export const selectEmotionState = (state: RootState) => state.dialogue.emotionState;
export const selectDialogueScenario = (state: RootState) => state.dialogue.currentScenario;
export const selectIsDialogueLoading = (state: RootState) => state.dialogue.isLoading;
export const selectDialogueError = (state: RootState) => state.dialogue.error;

export {dialogueSlice};
export default dialogueSlice.reducer;