import React from 'react';
import {render, fireEvent, waitFor, screen} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import EnhancedDialogueInterface from '../EnhancedDialogueInterface';
import dialogueSlice from '../../store/slices/dialogueSlice';
import characterSlice from '../../store/slices/characterSlice';
import {openaiService} from '../../services/openaiService';
import {conversationService} from '../../services/conversationService';
import {scenarioService} from '../../services/scenarioService';

// Mock services
jest.mock('../../services/openaiService');
jest.mock('../../services/conversationService');
jest.mock('../../services/scenarioService');

const mockOpenaiService = openaiService as jest.Mocked<typeof openaiService>;
const mockConversationService = conversationService as jest.Mocked<typeof conversationService>;
const mockScenarioService = scenarioService as jest.Mocked<typeof scenarioService>;

// Mock data
const mockCharacter = {
  id: 'aoi',
  name: '蒼',
  age: 22,
  personality: {
    aggressiveness: 60,
    kindness: 80,
    tsundereLevel: 30,
    shyness: 40,
  },
  appearance: {
    hairColor: 'black',
    eyeColor: 'brown',
    clothing: {
      id: 'casual_01',
      name: 'Casual Outfit',
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
    pitch: 50,
    tone: 'warm',
    speed: 1.0,
    emotionalRange: 70,
    voiceId: 'ja-JP-KeitaNeural',
  },
  description: 'A kind and gentle character',
  backstory: 'A 22-year-old student with a warm personality',
};

const mockConversation = {
  id: 'conv-1',
  characterId: 'aoi' as const,
  title: 'テスト会話',
  messages: [],
  startedAt: new Date(),
  lastMessageAt: new Date(),
  isFavorite: false,
  tags: [],
  summary: '',
  metadata: {
    totalMessages: 0,
    averageResponseTime: 0,
    emotionalArc: [],
    keyMoments: [],
  },
};

const mockMessage = {
  id: 'msg-1',
  text: 'こんにちは！',
  sender: 'character' as const,
  emotion: 'happy' as const,
  characterId: 'aoi' as const,
  timestamp: new Date(),
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      dialogue: dialogueSlice.reducer,
      character: characterSlice.reducer,
    },
    preloadedState: {
      dialogue: {
        currentDialogue: null,
        dialogueHistory: [],
        emotionState: 'neutral',
        currentScenario: null,
        isLoading: false,
        error: null,
      },
      character: {
        characters: { aoi: mockCharacter },
        activeCharacter: 'aoi',
        relationship: {
          type: 'senpai-kohai',
          intimacyLevel: 50,
          trustLevel: 50,
        },
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createMockStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('EnhancedDialogueInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockConversationService.createConversation.mockResolvedValue(mockConversation);
    mockConversationService.addMessage.mockResolvedValue(mockMessage);
    mockOpenaiService.generateDialogue.mockResolvedValue({
      text: 'こんにちは！元気ですか？',
      emotion: 'happy',
      confidence: 0.9,
    });
  });

  it('renders correctly', () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    expect(screen.getByText('蒼')).toBeTruthy();
    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeTruthy();
    expect(screen.getByText('送信')).toBeTruthy();
  });

  it('starts a new conversation on mount', async () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    await waitFor(() => {
      expect(mockConversationService.createConversation).toHaveBeenCalledWith(
        'aoi',
        undefined,
        undefined
      );
    });
  });

  it('sends user message and receives character response', async () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    // Type message
    fireEvent.changeText(textInput, 'こんにちは');
    
    // Send message
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockConversationService.addMessage).toHaveBeenCalledWith(
        mockConversation.id,
        expect.objectContaining({
          text: 'こんにちは',
          sender: 'user',
          emotion: 'neutral',
        })
      );
    });

    await waitFor(() => {
      expect(mockOpenaiService.generateDialogue).toHaveBeenCalledWith(
        expect.objectContaining({
          characterId: 'aoi',
          userMessage: 'こんにちは',
          conversationHistory: [],
        })
      );
    });

    await waitFor(() => {
      expect(mockConversationService.addMessage).toHaveBeenCalledWith(
        mockConversation.id,
        expect.objectContaining({
          text: 'こんにちは！元気ですか？',
          sender: 'character',
          emotion: 'happy',
          characterId: 'aoi',
        })
      );
    });
  });

  it('disables send button when input is empty', () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const sendButton = screen.getByText('送信');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テストメッセージ');
    
    expect(sendButton).not.toBeDisabled();
  });

  it('shows loading state while processing message', async () => {
    // Make the service take time to respond
    mockOpenaiService.generateDialogue.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        text: '応答',
        emotion: 'neutral',
        confidence: 0.9,
      }), 100))
    );

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テスト');
    fireEvent.press(sendButton);

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  it('opens scenario selector when scenario button is pressed', () => {
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const scenarioButton = screen.getByText('📝');
    fireEvent.press(scenarioButton);

    // EnhancedScenarioSelector should be visible
    expect(screen.getByText('シナリオを選択')).toBeTruthy();
  });

  it('handles scenario selection correctly', async () => {
    const mockScenario = {
      id: 'scenario-1',
      title: 'テストシナリオ',
      description: 'テスト用のシナリオ',
      category: 'daily' as const,
      difficulty: 'beginner' as const,
      tags: [],
      compatible_characters: ['aoi'],
      recommended_character: 'aoi' as const,
      context: {
        location: 'home',
        timeOfDay: 'morning' as const,
        mood: 'happy' as const,
        relationship_stage: 'friend' as const,
      },
      setting_description: 'テスト設定',
      duration_estimate: 15,
      conversation_starters: ['こんにちは！'],
      dialogue_triggers: [],
      suggested_topics: ['test'],
      target_emotions: ['happy'],
      emotional_progression: [{
        stage: 1,
        emotion: 'happy' as const,
        description: 'テスト',
      }],
      is_unlocked: true,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0,
      is_favorite: false,
    };

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const component = screen.getByTestId('enhanced-dialogue-interface');
    
    // Simulate scenario selection
    // This would typically be done through the scenario selector modal
    // For testing, we can simulate the callback
    const scenarioSelectCallback = component.props.onScenarioSelect;
    if (scenarioSelectCallback) {
      scenarioSelectCallback(mockScenario);
    }

    await waitFor(() => {
      expect(screen.getByText('テストシナリオ')).toBeTruthy();
    });
  });

  it('handles errors gracefully', async () => {
    mockOpenaiService.generateDialogue.mockRejectedValue(new Error('API Error'));

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テストエラー');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeTruthy();
    });
  });

  it('calls onMessageSent callback when provided', async () => {
    const onMessageSent = jest.fn();
    
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
        onMessageSent={onMessageSent}
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テスト');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(onMessageSent).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'こんにちは！元気ですか？',
          sender: 'character',
        })
      );
    });
  });

  it('calls onEmotionChange callback when provided', async () => {
    const onEmotionChange = jest.fn();
    
    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
        onEmotionChange={onEmotionChange}
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テスト');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(onEmotionChange).toHaveBeenCalledWith('happy');
    });
  });

  it('displays messages correctly', () => {
    const storeWithMessages = createMockStore({
      dialogue: {
        messages: [
          {
            id: 'msg-1',
            text: 'ユーザーメッセージ',
            sender: 'user',
            emotion: 'neutral',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            text: 'キャラクターメッセージ',
            sender: 'character',
            emotion: 'happy',
            characterId: 'aoi',
            timestamp: new Date(),
          },
        ],
        currentEmotion: 'happy',
        scenario: null,
        isActive: true,
      },
    });

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />,
      storeWithMessages
    );

    expect(screen.getByText('ユーザーメッセージ')).toBeTruthy();
    expect(screen.getByText('キャラクターメッセージ')).toBeTruthy();
  });

  it('shows emotion indicator for current emotion', () => {
    const storeWithEmotion = createMockStore({
      dialogue: {
        messages: [],
        currentEmotion: 'happy',
        scenario: null,
        isActive: true,
      },
    });

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />,
      storeWithEmotion
    );

    expect(screen.getByText('😊 happy')).toBeTruthy();
  });

  it('updates scenario progress when applicable', async () => {
    mockScenarioService.updateProgress.mockResolvedValue({
      scenario_id: 'scenario-1',
      user_id: 'user-1',
      started_at: new Date(),
      current_stage: 1,
      total_stages: 3,
      dialogue_count: 1,
      emotions_triggered: ['happy'],
      key_moments: [],
      is_completed: false,
    });

    renderWithProvider(
      <EnhancedDialogueInterface
        characterId="aoi"
        userId="user-1"
      />
    );

    const textInput = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByText('送信');

    fireEvent.changeText(textInput, 'テスト');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockScenarioService.updateProgress).toHaveBeenCalled();
    });
  });
});