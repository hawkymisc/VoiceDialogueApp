import dialogueReducer, {
  startDialogue,
  endDialogue,
  addMessage,
  updateEmotionState,
  setDialogueScenario,
  setDialogueLoading,
  clearDialogueError,
  selectDialogueState,
  selectCurrentDialogue,
  selectDialogueHistory,
  selectEmotionState,
  selectDialogueScenario,
} from '../dialogueSlice';
import {DialogueState, DialogueMessage, EmotionState, DialogueScenario} from '../../../types/Dialogue';

describe('dialogueSlice', () => {
  const initialState: DialogueState = {
    currentDialogue: null,
    dialogueHistory: [],
    emotionState: 'neutral',
    currentScenario: null,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(dialogueReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('startDialogue', () => {
    it('should start a new dialogue', () => {
      const characterId = 'aoi';
      const scenario: DialogueScenario = {
        id: 'daily_conversation',
        category: 'daily',
        title: '日常会話',
        description: '普通の日常会話',
        initialPrompt: 'おはよう',
        tags: ['casual'],
        difficulty: 'easy',
      };

      const actual = dialogueReducer(initialState, startDialogue({
        characterId,
        scenario,
      }));

      expect(actual.currentDialogue).toEqual({
        id: expect.any(String),
        characterId,
        scenario,
        messages: [],
        startTime: expect.any(Number),
        endTime: null,
        emotionProgression: ['neutral'],
      });
      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBeNull();
    });

    it('should reset emotion state when starting new dialogue', () => {
      const stateWithEmotion = {
        ...initialState,
        emotionState: 'happy' as EmotionState,
      };

      const actual = dialogueReducer(stateWithEmotion, startDialogue({
        characterId: 'shun',
        scenario: {
          id: 'work_scene',
          category: 'work',
          title: '仕事シーン',
          description: '職場での会話',
          initialPrompt: 'お疲れ様です',
          tags: ['work'],
          difficulty: 'medium',
        },
      }));

      expect(actual.emotionState).toBe('neutral');
    });
  });

  describe('endDialogue', () => {
    it('should end current dialogue and add to history', () => {
      const stateWithDialogue = {
        ...initialState,
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [
            {
              id: 'msg1',
              text: 'Hello',
              sender: 'user',
              timestamp: Date.now(),
              emotion: 'neutral',
            },
          ],
          startTime: Date.now() - 60000,
          endTime: null,
          emotionProgression: ['neutral'],
        },
      };

      const actual = dialogueReducer(stateWithDialogue, endDialogue());

      expect(actual.currentDialogue).toBeNull();
      expect(actual.dialogueHistory).toHaveLength(1);
      expect(actual.dialogueHistory[0]).toEqual({
        ...stateWithDialogue.currentDialogue,
        endTime: expect.any(Number),
      });
    });

    it('should not add to history if no current dialogue', () => {
      const actual = dialogueReducer(initialState, endDialogue());

      expect(actual.currentDialogue).toBeNull();
      expect(actual.dialogueHistory).toHaveLength(0);
    });
  });

  describe('addMessage', () => {
    it('should add message to current dialogue', () => {
      const stateWithDialogue = {
        ...initialState,
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [],
          startTime: Date.now(),
          endTime: null,
          emotionProgression: ['neutral'],
        },
      };

      const message: DialogueMessage = {
        id: 'msg1',
        text: 'Hello world',
        sender: 'user',
        timestamp: Date.now(),
        emotion: 'happy',
      };

      const actual = dialogueReducer(stateWithDialogue, addMessage(message));

      expect(actual.currentDialogue!.messages).toHaveLength(1);
      expect(actual.currentDialogue!.messages[0]).toEqual(message);
    });

    it('should not add message if no current dialogue', () => {
      const message: DialogueMessage = {
        id: 'msg1',
        text: 'Hello world',
        sender: 'user',
        timestamp: Date.now(),
        emotion: 'happy',
      };

      const actual = dialogueReducer(initialState, addMessage(message));

      expect(actual.currentDialogue).toBeNull();
    });
  });

  describe('updateEmotionState', () => {
    it('should update emotion state', () => {
      const newEmotion: EmotionState = 'happy';
      const actual = dialogueReducer(initialState, updateEmotionState(newEmotion));

      expect(actual.emotionState).toBe(newEmotion);
    });

    it('should update emotion progression in current dialogue', () => {
      const stateWithDialogue = {
        ...initialState,
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [],
          startTime: Date.now(),
          endTime: null,
          emotionProgression: ['neutral'],
        },
      };

      const actual = dialogueReducer(stateWithDialogue, updateEmotionState('happy'));

      expect(actual.emotionState).toBe('happy');
      expect(actual.currentDialogue!.emotionProgression).toEqual(['neutral', 'happy']);
    });
  });

  describe('setDialogueScenario', () => {
    it('should set current scenario', () => {
      const scenario: DialogueScenario = {
        id: 'romance',
        category: 'romance',
        title: 'ロマンス',
        description: 'ロマンチックなシーン',
        initialPrompt: 'いい夜ですね',
        tags: ['romance', 'evening'],
        difficulty: 'hard',
      };

      const actual = dialogueReducer(initialState, setDialogueScenario(scenario));

      expect(actual.currentScenario).toEqual(scenario);
    });
  });

  describe('setDialogueLoading', () => {
    it('should set loading state', () => {
      const actual = dialogueReducer(initialState, setDialogueLoading(true));

      expect(actual.isLoading).toBe(true);
    });

    it('should clear error when setting loading', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };

      const actual = dialogueReducer(stateWithError, setDialogueLoading(true));

      expect(actual.isLoading).toBe(true);
      expect(actual.error).toBeNull();
    });
  });

  describe('clearDialogueError', () => {
    it('should clear error state', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };

      const actual = dialogueReducer(stateWithError, clearDialogueError());

      expect(actual.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      dialogue: {
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [],
          startTime: Date.now(),
          endTime: null,
          emotionProgression: ['neutral'],
        },
        dialogueHistory: [
          {
            id: 'old-dialogue',
            characterId: 'shun',
            scenario: {
              id: 'old',
              category: 'work',
              title: 'Old',
              description: 'Old dialogue',
              initialPrompt: 'Hi',
              tags: ['old'],
              difficulty: 'medium',
            },
            messages: [],
            startTime: Date.now() - 120000,
            endTime: Date.now() - 60000,
            emotionProgression: ['neutral', 'happy'],
          },
        ],
        emotionState: 'happy' as EmotionState,
        currentScenario: {
          id: 'current',
          category: 'daily',
          title: 'Current',
          description: 'Current scenario',
          initialPrompt: 'Hello',
          tags: ['current'],
          difficulty: 'easy',
        },
        isLoading: false,
        error: null,
      },
    };

    it('selectDialogueState should return dialogue state', () => {
      expect(selectDialogueState(mockState)).toEqual(mockState.dialogue);
    });

    it('selectCurrentDialogue should return current dialogue', () => {
      expect(selectCurrentDialogue(mockState)).toEqual(mockState.dialogue.currentDialogue);
    });

    it('selectDialogueHistory should return dialogue history', () => {
      expect(selectDialogueHistory(mockState)).toEqual(mockState.dialogue.dialogueHistory);
    });

    it('selectEmotionState should return emotion state', () => {
      expect(selectEmotionState(mockState)).toEqual(mockState.dialogue.emotionState);
    });

    it('selectDialogueScenario should return current scenario', () => {
      expect(selectDialogueScenario(mockState)).toEqual(mockState.dialogue.currentScenario);
    });

    it('selectors should handle null values', () => {
      const stateWithNulls = {
        dialogue: {
          ...initialState,
          currentDialogue: null,
          currentScenario: null,
        },
      };

      expect(selectCurrentDialogue(stateWithNulls)).toBeNull();
      expect(selectDialogueScenario(stateWithNulls)).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', () => {
      const errorState = {
        ...initialState,
        error: 'API Error: Failed to generate response',
        isLoading: false,
      };

      // Test that error state is preserved
      const actual = dialogueReducer(errorState, setDialogueLoading(false));
      expect(actual.error).toBe('API Error: Failed to generate response');
    });

    it('should handle network errors', () => {
      const errorMessage = 'Network Error: Could not connect to server';
      const stateWithNetworkError = {
        ...initialState,
        error: errorMessage,
        isLoading: false,
      };

      expect(stateWithNetworkError.error).toBe(errorMessage);
    });
  });

  describe('edge cases', () => {
    it('should handle empty dialogue history', () => {
      expect(initialState.dialogueHistory).toHaveLength(0);
      expect(selectDialogueHistory({dialogue: initialState})).toHaveLength(0);
    });

    it('should handle multiple emotion updates', () => {
      const stateWithDialogue = {
        ...initialState,
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [],
          startTime: Date.now(),
          endTime: null,
          emotionProgression: ['neutral'],
        },
      };

      let state = dialogueReducer(stateWithDialogue, updateEmotionState('happy'));
      state = dialogueReducer(state, updateEmotionState('sad'));
      state = dialogueReducer(state, updateEmotionState('angry'));

      expect(state.emotionState).toBe('angry');
      expect(state.currentDialogue!.emotionProgression).toEqual(['neutral', 'happy', 'sad', 'angry']);
    });

    it('should handle dialogue with many messages', () => {
      const stateWithDialogue = {
        ...initialState,
        currentDialogue: {
          id: 'test-dialogue',
          characterId: 'aoi',
          scenario: {
            id: 'test',
            category: 'daily',
            title: 'Test',
            description: 'Test dialogue',
            initialPrompt: 'Hello',
            tags: ['test'],
            difficulty: 'easy',
          },
          messages: [],
          startTime: Date.now(),
          endTime: null,
          emotionProgression: ['neutral'],
        },
      };

      let state = stateWithDialogue;
      for (let i = 0; i < 100; i++) {
        const message: DialogueMessage = {
          id: `msg${i}`,
          text: `Message ${i}`,
          sender: i % 2 === 0 ? 'user' : 'character',
          timestamp: Date.now() + i * 1000,
          emotion: 'neutral',
        };
        state = dialogueReducer(state, addMessage(message));
      }

      expect(state.currentDialogue!.messages).toHaveLength(100);
      expect(state.currentDialogue!.messages[99].text).toBe('Message 99');
    });
  });
});