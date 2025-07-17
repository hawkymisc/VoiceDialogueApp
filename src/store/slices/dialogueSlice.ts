import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  ConversationState,
  Conversation,
  DialogueMessage,
  DialogueRequest,
  DialogueResponse,
  ScenarioType,
  ConversationHistory,
} from '../../types/Dialogue';

// Initial state
const initialState: ConversationState = {
  currentConversation: null,
  conversationHistory: {
    conversations: [],
    totalCount: 0,
    favoriteConversations: [],
  },
  isGenerating: false,
  currentSpeaker: null,
  availableScenarios: [
    'daily-conversation',
    'work-scene',
    'special-event',
    'emotional-scene',
    'comedy-scene',
    'romantic-scene',
  ],
  error: null,
};

// Async thunks
export const generateDialogue = createAsyncThunk(
  'dialogue/generateDialogue',
  async (request: DialogueRequest, {rejectWithValue}) => {
    try {
      const response = await fetch('/api/dialogue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to generate dialogue');
      }
      const data: DialogueResponse = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const fetchConversationHistory = createAsyncThunk(
  'dialogue/fetchConversationHistory',
  async (userId: string, {rejectWithValue}) => {
    try {
      const response = await fetch(`/api/conversations/history/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation history');
      }
      const data: ConversationHistory = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const saveConversation = createAsyncThunk(
  'dialogue/saveConversation',
  async (conversation: Conversation, {rejectWithValue}) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversation),
      });
      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }
      return conversation;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const addToFavorites = createAsyncThunk(
  'dialogue/addToFavorites',
  async (
    {userId, conversationId}: {userId: string; conversationId: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({userId}),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to add to favorites');
      }
      return conversationId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

// Dialogue slice
export const dialogueSlice = createSlice({
  name: 'dialogue',
  initialState,
  reducers: {
    startNewConversation: (
      state,
      action: PayloadAction<{
        userId: string;
        scenario: ScenarioType;
        participants: string[];
      }>,
    ) => {
      const {userId, scenario, participants} = action.payload;
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        userId,
        participants,
        messages: [],
        scenario,
        startTime: new Date(),
        metadata: {
          totalMessages: 0,
          averageRating: 0,
          tags: [],
        },
      };
      state.currentConversation = newConversation;
      state.currentSpeaker = null;
    },
    endCurrentConversation: state => {
      if (state.currentConversation) {
        state.currentConversation.endTime = new Date();
        state.currentConversation.metadata.totalMessages =
          state.currentConversation.messages.length;
        // Add to history
        state.conversationHistory.conversations.unshift(
          state.currentConversation,
        );
        state.conversationHistory.totalCount += 1;
        state.currentConversation = null;
      }
      state.currentSpeaker = null;
    },
    addMessage: (state, action: PayloadAction<DialogueMessage>) => {
      if (state.currentConversation) {
        state.currentConversation.messages.push(action.payload);
        state.currentConversation.metadata.totalMessages += 1;
      }
    },
    setCurrentSpeaker: (state, action: PayloadAction<string | null>) => {
      state.currentSpeaker = action.payload;
    },
    updateMessageRating: (
      state,
      action: PayloadAction<{
        messageId: string;
        rating: number;
      }>,
    ) => {
      const {messageId, rating} = action.payload;
      if (state.currentConversation) {
        const message = state.currentConversation.messages.find(
          m => m.id === messageId,
        );
        if (message) {
          message.metadata.userRating = rating;
        }
      }
    },
    toggleMessageFavorite: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      if (state.currentConversation) {
        const message = state.currentConversation.messages.find(
          m => m.id === messageId,
        );
        if (message) {
          message.metadata.isFavorite = !message.metadata.isFavorite;
        }
      }
    },
    setAvailableScenarios: (state, action: PayloadAction<ScenarioType[]>) => {
      state.availableScenarios = action.payload;
    },
    clearDialogueError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Generate dialogue
      .addCase(generateDialogue.pending, state => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateDialogue.fulfilled, (state, action) => {
        state.isGenerating = false;
        const {message, nextSpeaker} = action.payload;
        if (state.currentConversation) {
          state.currentConversation.messages.push(message);
          state.currentConversation.metadata.totalMessages += 1;
        }
        state.currentSpeaker = nextSpeaker;
      })
      .addCase(generateDialogue.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      // Fetch conversation history
      .addCase(fetchConversationHistory.pending, state => {
        state.error = null;
      })
      .addCase(fetchConversationHistory.fulfilled, (state, action) => {
        state.conversationHistory = action.payload;
      })
      .addCase(fetchConversationHistory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Save conversation
      .addCase(saveConversation.fulfilled, (state, action) => {
        const savedConversation = action.payload;
        const existingIndex = state.conversationHistory.conversations.findIndex(
          c => c.id === savedConversation.id,
        );
        if (existingIndex >= 0) {
          state.conversationHistory.conversations[existingIndex] =
            savedConversation;
        } else {
          state.conversationHistory.conversations.unshift(savedConversation);
          state.conversationHistory.totalCount += 1;
        }
      })
      // Add to favorites
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const conversationId = action.payload;
        if (
          !state.conversationHistory.favoriteConversations.includes(
            conversationId,
          )
        ) {
          state.conversationHistory.favoriteConversations.push(conversationId);
        }
      });
  },
});

export const {
  startNewConversation,
  endCurrentConversation,
  addMessage,
  setCurrentSpeaker,
  updateMessageRating,
  toggleMessageFavorite,
  setAvailableScenarios,
  clearDialogueError,
} = dialogueSlice.actions;

export default dialogueSlice.reducer;
