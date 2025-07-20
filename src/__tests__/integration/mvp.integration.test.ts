import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {configureStore} from '@reduxjs/toolkit';

import {HomeScreen} from '../../screens/HomeScreen';
import {CharacterScreen} from '../../screens/CharacterScreen';
import {DialogueScreen} from '../../screens/DialogueScreen';
import {characterSlice} from '../../store/slices/characterSlice';
import {audioSlice} from '../../store/slices/audioSlice';
import {userSlice} from '../../store/slices/userSlice';
import {userService} from '../../services/userService';
import {conversationService} from '../../services/conversationService';
import {audioService} from '../../services/audioService';

// Mock services
jest.mock('../../services/openaiService', () => ({
  openaiService: {
    getInitializationStatus: jest.fn(() => true),
    testConnection: jest.fn(() => Promise.resolve(true)),
    generateDialogue: jest.fn(() => Promise.resolve({
      text: 'こんにちは！今日はどんな一日でしたか？',
      emotion: 'happy',
      confidence: 0.9,
    })),
  },
}));

jest.mock('../../services/ttsService', () => ({
  ttsService: {
    getInitializationStatus: jest.fn(() => true),
    synthesizeSpeech: jest.fn(() => Promise.resolve({
      success: true,
      audioUrl: 'test://generated-speech.mp3',
    })),
  },
}));

jest.mock('../../services/audioService');
jest.mock('../../services/userService');
jest.mock('../../services/conversationService');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock components with complex dependencies
jest.mock('../../components/EnhancedDialogueInterface', () => ({
  __esModule: true,
  default: ({onMessageSent}: any) => {
    const React = require('react');
    const {View, Text, TouchableOpacity} = require('react-native');
    
    return React.createElement(
      View,
      {testID: 'enhanced-dialogue-interface'},
      React.createElement(Text, null, 'Dialogue Interface'),
      React.createElement(
        TouchableOpacity,
        {
          testID: 'send-user-message',
          onPress: () => onMessageSent({
            id: 'user-msg-1',
            text: 'こんにちは',
            sender: 'user',
            timestamp: new Date(),
          })
        },
        React.createElement(Text, null, 'Send Message')
      )
    );
  },
}));

jest.mock('../../components/CharacterSelector', () => ({
  CharacterSelector: ({showStartButton, onCharacterSelect}: any) => {
    const React = require('react');
    const {View, Text, TouchableOpacity} = require('react-native');
    
    return React.createElement(
      View,
      {testID: 'character-selector'},
      React.createElement(Text, null, 'Character Selector'),
      React.createElement(
        TouchableOpacity,
        {
          testID: 'select-aoi',
          onPress: () => onCharacterSelect && onCharacterSelect('aoi')
        },
        React.createElement(Text, null, '蒼')
      ),
      showStartButton && React.createElement(
        TouchableOpacity,
        {testID: 'start-dialogue'},
        React.createElement(Text, null, '対話を始める')
      )
    );
  },
}));

jest.mock('../../components/AudioController', () => ({
  AudioController: ({audioUrl, onPlay}: any) => {
    const React = require('react');
    const {View, Text, TouchableOpacity} = require('react-native');
    
    return React.createElement(
      View,
      {testID: 'audio-controller'},
      React.createElement(Text, {testID: 'audio-url'}, audioUrl),
      React.createElement(
        TouchableOpacity,
        {testID: 'audio-play', onPress: onPlay},
        React.createElement(Text, null, 'Play Audio')
      )
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
            description: 'Test character',
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
        activeCharacter: null,
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

const MVPTestApp = () => {
  const store = createTestStore();
  
  return React.createElement(
    Provider,
    {store},
    React.createElement(
      NavigationContainer,
      null,
      React.createElement(
        Stack.Navigator,
        {initialRouteName: "Home"},
        React.createElement(Stack.Screen, {name: "Home", component: HomeScreen}),
        React.createElement(Stack.Screen, {name: "Character", component: CharacterScreen}),
        React.createElement(Stack.Screen, {name: "Dialogue", component: DialogueScreen})
      )
    )
  );
};

describe('MVP Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock service implementations
    (userService.initializeUser as jest.Mock).mockResolvedValue({
      id: 'test-user',
      username: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {},
      statistics: {},
      subscriptionTier: 'free',
      isActive: true,
    });
    
    (conversationService.createConversation as jest.Mock).mockResolvedValue({
      id: 'test-conversation',
      characterId: 'aoi',
      title: '蒼との会話',
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
    });
    
    (audioService.playAudio as jest.Mock).mockResolvedValue(true);
    (audioService.getPlaybackState as jest.Mock).mockReturnValue({
      isPlaying: false,
      position: 0,
      duration: 0,
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full navigation flow: Home → Character → Dialogue', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // 1. Start from Home Screen
      expect(getByText('Voice Dialogue App')).toBeTruthy();
      expect(getByText('対話を始める')).toBeTruthy();
      
      // 2. Navigate to Character Selection
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByText('キャラクター選択')).toBeTruthy();
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      // 3. Select character
      fireEvent.press(getByTestId('select-aoi'));
      
      // 4. Start dialogue
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByText('蒼との対話')).toBeTruthy();
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
    });

    it('should handle complete dialogue flow with audio', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue screen
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // Send user message
      fireEvent.press(getByTestId('send-user-message'));
      
      // Verify TTS and audio controller appear
      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
      });
      
      // Test audio playback
      fireEvent.press(getByTestId('audio-play'));
      
      expect(audioService.playAudio).toHaveBeenCalledWith(
        expect.objectContaining({
          audioUrl: 'test://generated-speech.mp3',
          characterId: 'aoi',
        })
      );
    });
  });

  describe('Service Integration', () => {
    it('should integrate user service with dialogue flow', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate and start dialogue
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // User initialization should be called
      expect(userService.initializeUser).toHaveBeenCalled();
    });

    it('should integrate conversation service with message flow', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // Send message
      fireEvent.press(getByTestId('send-user-message'));
      
      // Conversation should be created and message added
      expect(conversationService.createConversation).toHaveBeenCalledWith(
        'aoi',
        undefined,
        expect.any(String)
      );
    });

    it('should integrate audio service with TTS', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue and send message
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('send-user-message'));
      
      // Audio controller should appear with correct URL
      await waitFor(() => {
        const audioUrl = getByTestId('audio-url');
        expect(audioUrl.props.children).toBe('test://generated-speech.mp3');
      });
      
      // Audio playback should work
      fireEvent.press(getByTestId('audio-play'));
      expect(audioService.playAudio).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization failures gracefully', async () => {
      const {openaiService} = require('../../services/openaiService');
      openaiService.getInitializationStatus.mockReturnValue(false);
      
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByText('初期化エラー')).toBeTruthy();
      });
    });

    it('should handle TTS service failures gracefully', async () => {
      const {ttsService} = require('../../services/ttsService');
      ttsService.synthesizeSpeech.mockRejectedValue(new Error('TTS Error'));
      
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // Send message - should not crash even if TTS fails
      fireEvent.press(getByTestId('send-user-message'));
      
      // Interface should still be functional
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
    });

    it('should handle audio service failures gracefully', async () => {
      (audioService.playAudio as jest.Mock).mockResolvedValue(false);
      
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate and send message
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('send-user-message'));
      
      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
      });
      
      // Audio play should fail gracefully
      fireEvent.press(getByTestId('audio-play'));
      expect(audioService.playAudio).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should maintain state across navigation', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate and select character
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      
      // Character should be selected in state
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByText('蒼との対話')).toBeTruthy();
      });
    });

    it('should handle audio state updates correctly', async () => {
      (audioService.getPlaybackState as jest.Mock).mockReturnValue({
        isPlaying: true,
        position: 1000,
        duration: 30000,
      });
      
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue and trigger audio
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('send-user-message'));
      
      await waitFor(() => {
        expect(getByTestId('audio-controller')).toBeTruthy();
      });
      
      // Audio state should be managed correctly
      fireEvent.press(getByTestId('audio-play'));
      expect(audioService.playAudio).toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    it('should persist user data through services', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Start dialogue flow
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // User initialization should persist data
      expect(userService.initializeUser).toHaveBeenCalled();
    });

    it('should persist conversation data', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate and send message
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('send-user-message'));
      
      // Conversation should be created and persisted
      expect(conversationService.createConversation).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should load screens efficiently', async () => {
      const startTime = Date.now();
      
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate through all screens
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      const endTime = Date.now();
      
      // Should complete navigation in reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle multiple rapid interactions', async () => {
      const {getByText, getByTestId} = render(React.createElement(MVPTestApp));
      
      // Navigate to dialogue
      fireEvent.press(getByText('対話を始める'));
      
      await waitFor(() => {
        expect(getByTestId('character-selector')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('select-aoi'));
      fireEvent.press(getByTestId('start-dialogue'));
      
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
      
      // Send multiple messages rapidly
      const sendButton = getByTestId('send-user-message');
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      
      // Should handle rapid interactions without crashing
      await waitFor(() => {
        expect(getByTestId('enhanced-dialogue-interface')).toBeTruthy();
      });
    });
  });
});