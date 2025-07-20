import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {configureStore} from '@reduxjs/toolkit';

import {DialogueScreen} from '../DialogueScreen';
import {characterSlice} from '../../store/slices/characterSlice';
import {audioSlice} from '../../store/slices/audioSlice';
import {userSlice} from '../../store/slices/userSlice';

// Mock services
jest.mock('../../services/openaiService', () => ({
  openaiService: {
    getInitializationStatus: jest.fn(() => true),
    testConnection: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('../../services/ttsService', () => ({
  ttsService: {
    getInitializationStatus: jest.fn(() => true),
    synthesizeSpeech: jest.fn(() => Promise.resolve({
      success: true,
      audioUrl: 'test://audio.mp3',
    })),
  },
}));

jest.mock('../../services/audioService', () => ({
  audioService: {
    playAudio: jest.fn(() => Promise.resolve(true)),
    pauseAudio: jest.fn(() => Promise.resolve(true)),
    stopAudio: jest.fn(() => Promise.resolve(true)),
    setVolume: jest.fn(() => Promise.resolve(true)),
    seekTo: jest.fn(() => Promise.resolve(true)),
    getPlaybackState: jest.fn(() => ({
      isPlaying: false,
      position: 0,
      duration: 0,
    })),
  },
}));

jest.mock('../../components', () => ({
  EnhancedDialogueInterface: ({onMessageSent, onEmotionChange}: any) => {
    const MockComponent = require('react-native').View;
    const MockText = require('react-native').Text;
    const MockTouchable = require('react-native').TouchableOpacity;
    
    return (
      <MockComponent testID="enhanced-dialogue-interface">
        <MockText>Enhanced Dialogue Interface</MockText>
        <MockTouchable
          testID="send-message-button"
          onPress={() => onMessageSent({
            id: 'test-message',
            text: 'テストメッセージ',
            sender: 'character',
            emotion: 'happy',
            timestamp: new Date(),
          })}>
          <MockText>Send Test Message</MockText>
        </MockTouchable>
        <MockTouchable
          testID="change-emotion-button"
          onPress={() => onEmotionChange('sad')}>
          <MockText>Change Emotion</MockText>
        </MockTouchable>
      </MockComponent>
    );
  },
  AudioController: ({audioUrl, onPlay}: any) => {
    const MockComponent = require('react-native').View;
    const MockText = require('react-native').Text;
    const MockTouchable = require('react-native').TouchableOpacity;
    
    return (
      <MockComponent testID="audio-controller">
        <MockText>Audio Controller</MockText>
        <MockText testID="audio-url">{audioUrl}</MockText>
        <MockTouchable testID="play-button" onPress={onPlay}>
          <MockText>Play</MockText>
        </MockTouchable>
      </MockComponent>
    );
  },
}));

const Stack = createStackNavigator();

const createTestStore = () => {
  return configureStore({
    reducer: {
      character: characterSlice.reducer,
      audio: audioSlice.reducer,
      user: userSlice.reducer,
    },
    preloadedState: {
      character: {
        characters: {
          aoi: {
            id: 'aoi',
            name: '蒼',
            age: 22,
            description: 'Test character description',
            personality: {
              aggressiveness: 30,
              kindness: 80,
              tsundere_level: 20,
              shyness: 60,
            },
            appearance: {
              height: 170,
              build: 'slim',
              hairColor: 'blue',
              eyeColor: 'blue',
            },
            voice: {
              provider: 'azure',
              voiceId: 'ja-JP-KeitaNeural',
              pitch: 0,
              speed: 1.0,
              volume: 1.0,
            },
          },
        },
        activeCharacter: 'aoi',
        relationshipSettings: {
          type: 'friend',
          intimacyLevel: 50,
          trustLevel: 60,
        },
        isLoading: false,
        error: null,
      },
      audio: {
        currentTrack: null,
        isPlaying: false,
        volume: 80,
        speed: 1.0,
        position: 0,
        duration: 0,
        playlist: [],
        isLoading: false,
        error: null,
      },
      user: {
        profile: null,
        favoriteConversations: [],
        unlockedContent: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (route = {params: {characterId: 'aoi', userId: 'test-user'}}) => {
  const store = createTestStore();
  
  const TestComponent = () => (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Dialogue"
            component={DialogueScreen}
            initialParams={route.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );

  return render(<TestComponent />);
};

describe('DialogueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should render loading state initially', () => {
      const {getByText} = renderWithProviders();
      expect(getByText('サービスを初期化しています...')).toBeTruthy();
    });

    it('should complete initialization and show dialogue interface', async () => {
      const {getByTestId, getByText, queryByText} = renderWithProviders();
      
      await waitFor(() => {
        expect(queryByText('サービスを初期化しています...')).toBeFalsy();
      });
      
      expect(getByText('蒼との対話')).toBeTruthy();
      expect(getByText('Test character description')).toBeTruthy();
      expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
    });

    it('should show error state when initialization fails', async () => {
      const {openaiService} = require('../../services/openaiService');
      openaiService.getInitializationStatus.mockReturnValue(false);

      const {getByText, getByRole} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByText('初期化エラー')).toBeTruthy();
        expect(getByText(/OpenAI サービスが初期化されていません/)).toBeTruthy();
      });
    });

    it('should handle missing character gracefully', async () => {
      const {getByText} = renderWithProviders({
        params: {characterId: 'nonexistent', userId: 'test-user'}
      });
      
      await waitFor(() => {
        expect(getByText('キャラクターが見つかりません')).toBeTruthy();
        expect(getByText('キャラクター ID: nonexistent')).toBeTruthy();
      });
    });
  });

  describe('Dialogue Interaction', () => {
    it('should handle message sending', async () => {
      const {getByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      const sendButton = getByTestId('send-message-button');
      fireEvent.press(sendButton);

      const {ttsService} = require('../../services/ttsService');
      
      await waitFor(() => {
        expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith({
          text: 'テストメッセージ',
          characterId: 'aoi',
          emotion: 'happy',
        });
      });
    });

    it('should handle emotion changes', async () => {
      const {getByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      const emotionButton = getByTestId('change-emotion-button');
      fireEvent.press(emotionButton);

      // Emotion change should be logged
      expect(console.log).toHaveBeenCalledWith('Emotion changed to:', 'sad');
    });

    it('should continue when TTS generation fails', async () => {
      const {ttsService} = require('../../services/ttsService');
      ttsService.synthesizeSpeech.mockRejectedValue(new Error('TTS Error'));

      const {getByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      const sendButton = getByTestId('send-message-button');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(ttsService.synthesizeSpeech).toHaveBeenCalled();
        // Should not crash and continue normally
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
    });
  });

  describe('Audio Integration', () => {
    it('should show audio controller when audio is available', async () => {
      const {getByTestId, queryByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      // Initially no audio controller
      expect(queryByTestId('audio-controller')).toBeFalsy();

      // Send message to trigger TTS
      const sendButton = getByTestId('send-message-button');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
        expect(getByTestId('audio-url')).toBeTruthy();
      });
    });

    it('should handle audio playback', async () => {
      const {getByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      // Send message to trigger TTS and show audio controller
      const sendButton = getByTestId('send-message-button');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
      });

      const playButton = getByTestId('play-button');
      fireEvent.press(playButton);

      const {audioService} = require('../../services/audioService');
      
      await waitFor(() => {
        expect(audioService.playAudio).toHaveBeenCalledWith(
          expect.objectContaining({
            audioUrl: 'test://audio.mp3',
            characterId: 'aoi',
          })
        );
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should receive route parameters correctly', async () => {
      const customParams = {characterId: 'aoi', userId: 'custom-user'};
      const {getByText} = renderWithProviders({params: customParams});
      
      await waitFor(() => {
        expect(getByText('蒼との対話')).toBeTruthy();
      });
    });

    it('should handle navigation back on error', async () => {
      const {openaiService} = require('../../services/openaiService');
      openaiService.getInitializationStatus.mockReturnValue(false);

      const {getByText} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByText('戻る')).toBeTruthy();
      });

      // Test back navigation would be called
      const backButton = getByText('戻る');
      fireEvent.press(backButton);
      
      // Navigation mock would verify goBack was called
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', async () => {
      const {openaiService} = require('../../services/openaiService');
      openaiService.testConnection.mockRejectedValue(new Error('Connection failed'));

      const {getByText} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByText('初期化エラー')).toBeTruthy();
      });
    });

    it('should provide retry functionality on error', async () => {
      const {openaiService} = require('../../services/openaiService');
      openaiService.getInitializationStatus.mockReturnValue(false);

      const {getByText} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByText('再試行')).toBeTruthy();
      });

      // Reset mock to simulate successful retry
      openaiService.getInitializationStatus.mockReturnValue(true);
      
      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('蒼との対話')).toBeTruthy();
      });
    });
  });

  describe('State Management', () => {
    it('should properly manage audio state', async () => {
      const {getByTestId} = renderWithProviders();
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });

      // Send message to trigger audio state change
      const sendButton = getByTestId('send-message-button');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
      });

      // Audio state should be managed properly
      const playButton = getByTestId('play-button');
      fireEvent.press(playButton);

      // Audio service should be called with correct parameters
      const {audioService} = require('../../services/audioService');
      expect(audioService.playAudio).toHaveBeenCalledTimes(1);
    });
  });
});