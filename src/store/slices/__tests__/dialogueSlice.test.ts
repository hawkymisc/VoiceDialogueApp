import {configureStore} from '@reduxjs/toolkit';
import dialogueSlice, {
  startDialogue,
  endDialogue,
  addMessage,
  updateEmotionState,
  setDialogueScenario,
  clearDialogueHistory,
  removeDialogueFromHistory,
  rateDialogue,
  generateDialogueResponse,
  loadDialogueHistory,
  restoreConversation,
} from '../dialogueSlice';
import {DialogueScenario, DialogueMessage, DialogueState} from '../../../types/Dialogue';
import {openaiService} from '../../../services/openaiService';
import {historyService, ConversationSaveData} from '../../../services/historyService';

// Mock services
jest.mock('../../../services/openaiService');
jest.mock('../../../services/historyService');

describe('Dialogue Slice', () => {
  const mockScenario: DialogueScenario = {
    id: 'daily_morning',
    category: 'daily',
    title: '朝の挨拶',
    description: '朝の何気ない会話',
    initialPrompt: '今日も一日お疲れ様です。',
    tags: ['morning', 'greeting'],
    difficulty: 'easy',
  };

  const mockMessage: DialogueMessage = {
    id: 'msg-1',
    text: 'こんにちは',
    sender: 'user',
    timestamp: Date.now(),
    emotion: 'neutral',
  };

  let store: ReturnType<typeof configureStore<{dialogue: DialogueState}>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        dialogue: dialogueSlice,
      },
    });
    jest.clearAllMocks();
  });

  describe('startDialogue', () => {
    it('should start a new dialogue', () => {
      const action = startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      });

      store.dispatch(action);
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeTruthy();
      expect(state.currentDialogue?.characterId).toBe('aoi');
      expect(state.currentDialogue?.scenario).toEqual(mockScenario);
      expect(state.currentDialogue?.messages).toHaveLength(0);
      expect(state.currentDialogue?.emotionProgression).toEqual(['neutral']);
      expect(state.emotionState).toBe('neutral');
      expect(state.currentScenario).toEqual(mockScenario);
      expect(state.error).toBeNull();
    });
  });

  describe('endDialogue', () => {
    it('should end current dialogue and add to history', () => {
      // Start a dialogue first
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));

      // Add some messages
      store.dispatch(addMessage(mockMessage));

      // End the dialogue
      store.dispatch(endDialogue());
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeNull();
      expect(state.currentScenario).toBeNull();
      expect(state.dialogueHistory).toHaveLength(1);
      expect(state.dialogueHistory[0].characterId).toBe('aoi');
      expect(state.dialogueHistory[0].scenario).toEqual(mockScenario);
      expect(state.dialogueHistory[0].messageCount).toBe(1);
      expect(historyService.saveConversation).toHaveBeenCalled();
      expect(historyService.addToHistory).toHaveBeenCalled();
    });

    it('should not do anything if no current dialogue', () => {
      store.dispatch(endDialogue());
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeNull();
      expect(state.dialogueHistory).toHaveLength(0);
    });
  });

  describe('addMessage', () => {
    it('should add message to current dialogue', () => {
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));

      store.dispatch(addMessage(mockMessage));
      const state = store.getState().dialogue;

      expect(state.currentDialogue?.messages).toHaveLength(1);
      expect(state.currentDialogue?.messages[0]).toEqual(mockMessage);
    });

    it('should not add message if no current dialogue', () => {
      store.dispatch(addMessage(mockMessage));
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeNull();
    });
  });

  describe('updateEmotionState', () => {
    it('should update emotion state and add to progression', () => {
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));

      store.dispatch(updateEmotionState('happy'));
      const state = store.getState().dialogue;

      expect(state.emotionState).toBe('happy');
      expect(state.currentDialogue?.emotionProgression).toEqual(['neutral', 'happy']);
    });

    it('should update emotion state without current dialogue', () => {
      store.dispatch(updateEmotionState('sad'));
      const state = store.getState().dialogue;

      expect(state.emotionState).toBe('sad');
      expect(state.currentDialogue).toBeNull();
    });
  });

  describe('setDialogueScenario', () => {
    it('should set current scenario', () => {
      store.dispatch(setDialogueScenario(mockScenario));
      const state = store.getState().dialogue;

      expect(state.currentScenario).toEqual(mockScenario);
    });
  });

  describe('clearDialogueHistory', () => {
    it('should clear dialogue history', () => {
      // Add some history first
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));
      store.dispatch(endDialogue());

      // Clear history
      store.dispatch(clearDialogueHistory());
      const state = store.getState().dialogue;

      expect(state.dialogueHistory).toHaveLength(0);
      expect(historyService.clearAllHistory).toHaveBeenCalled();
    });
  });

  describe('removeDialogueFromHistory', () => {
    it('should remove dialogue from history', () => {
      // Add some history first
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));
      store.dispatch(endDialogue());

      const dialogueId = store.getState().dialogue.dialogueHistory[0].id;

      // Remove from history
      store.dispatch(removeDialogueFromHistory(dialogueId));
      const state = store.getState().dialogue;

      expect(state.dialogueHistory).toHaveLength(0);
      expect(historyService.removeFromHistory).toHaveBeenCalledWith(dialogueId);
    });
  });

  describe('rateDialogue', () => {
    it('should rate dialogue in history', () => {
      // Add some history first
      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));
      store.dispatch(endDialogue());

      const dialogueId = store.getState().dialogue.dialogueHistory[0].id;

      // Rate the dialogue
      store.dispatch(rateDialogue({ dialogueId, rating: 5 }));
      const state = store.getState().dialogue;

      expect(state.dialogueHistory[0].rating).toBe(5);
    });
  });

  describe('generateDialogueResponse', () => {
    it('should generate dialogue response successfully', async () => {
      const mockResponse = {
        text: 'こんにちは！元気ですか？',
        emotion: 'happy' as const,
      };

      (openaiService.generateDialogue as jest.Mock).mockResolvedValue(mockResponse);

      store.dispatch(startDialogue({
        characterId: 'aoi',
        scenario: mockScenario,
      }));

      const action = generateDialogueResponse({
        characterId: 'aoi',
        userMessage: 'こんにちは',
        conversationHistory: [],
      });

      await store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.emotionState).toBe('happy');
      expect(state.currentDialogue?.messages).toHaveLength(1);
      expect(state.currentDialogue?.messages[0].text).toBe('こんにちは！元気ですか？');
      expect(state.currentDialogue?.messages[0].sender).toBe('character');
      expect(state.currentDialogue?.messages[0].emotion).toBe('happy');
    });

    it('should handle dialogue generation error', async () => {
      (openaiService.generateDialogue as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const action = generateDialogueResponse({
        characterId: 'aoi',
        userMessage: 'こんにちは',
        conversationHistory: [],
      });

      await store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('API Error');
    });

    it('should set loading state during generation', () => {
      const action = generateDialogueResponse({
        characterId: 'aoi',
        userMessage: 'こんにちは',
        conversationHistory: [],
      });

      store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('loadDialogueHistory', () => {
    it('should load dialogue history from service', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          characterId: 'aoi' as const,
          scenario: mockScenario,
          startTime: Date.now(),
          endTime: Date.now(),
          messageCount: 5,
          emotionProgression: ['neutral', 'happy'],
        },
      ];

      (historyService.loadDialogueHistory as jest.Mock).mockResolvedValue(mockHistory);

      const action = loadDialogueHistory();
      await store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.dialogueHistory).toEqual(mockHistory);
    });
  });

  describe('restoreConversation', () => {
    it('should restore conversation from history', async () => {
      const mockConversation = {
        id: 'conv-1',
        characterId: 'aoi' as const,
        scenario: mockScenario,
        messages: [mockMessage],
        startTime: Date.now(),
        endTime: Date.now(),
        metadata: {
          emotionProgression: ['neutral', 'happy'],
          messageCount: 1,
          duration: 300000,
          lastActivity: Date.now(),
        },
      };

      (historyService.loadConversationById as jest.Mock).mockResolvedValue(mockConversation);

      const action = restoreConversation('conv-1');
      await store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeTruthy();
      expect(state.currentDialogue?.id).toBe('conv-1');
      expect(state.currentDialogue?.characterId).toBe('aoi');
      expect(state.currentDialogue?.scenario).toEqual(mockScenario);
      expect(state.currentDialogue?.messages).toEqual([mockMessage]);
      expect(state.currentScenario).toEqual(mockScenario);
      expect(state.emotionState).toBe('happy');
    });

    it('should handle restore conversation failure', async () => {
      (historyService.loadConversationById as jest.Mock).mockResolvedValue(null);

      const action = restoreConversation('nonexistent');
      await store.dispatch(action as any);
      const state = store.getState().dialogue;

      expect(state.currentDialogue).toBeNull();
    });
  });
});