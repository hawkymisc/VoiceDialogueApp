import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {RootState} from '../store';
import {CharacterType} from '../types/Character';
import {DialogueMessage} from '../types/Dialogue';
import {EnhancedDialogueInterface, AudioController} from '../components';
import {llmService} from '../services/llmService';
import {ttsProviderService} from '../services/ttsProviderService';
import {audioService} from '../services/audioService';
import {configService} from '../services/configService';

type DialogueScreenRouteProp = RouteProp<
  {Dialogue: {characterId: CharacterType; userId: string}},
  'Dialogue'
>;

type DialogueScreenNavigationProp = StackNavigationProp<any, 'Dialogue'>;

export const DialogueScreen: React.FC = () => {
  const route = useRoute<DialogueScreenRouteProp>();
  const navigation = useNavigation<DialogueScreenNavigationProp>();
  const dispatch = useDispatch();

  const {characterId, userId} = route.params;
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    volume: 80,
    speed: 1.0,
    currentTime: 0,
    duration: 0,
    isLooping: false,
    autoPlay: true,
  });

  const character = useSelector((state: RootState) => 
    state.character.characters[characterId]
  );

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      // Load configuration
      const config = configService.loadConfig();
      const status = configService.getProviderStatus();

      console.log('Initializing services with config:', status);

      // Initialize LLM service
      if (!llmService.getInitializationStatus()) {
        if (status.llm.configured) {
          await llmService.initialize(config.llm);
        } else {
          console.warn('LLM service not configured. Please check your API keys.');
        }
      }

      // Initialize TTS service
      if (!ttsProviderService.getInitializationStatus()) {
        if (status.tts.configured) {
          await ttsProviderService.initialize(config.tts);
        } else {
          console.warn('TTS service not configured, using Web Speech API as fallback');
          await ttsProviderService.initialize({
            provider: 'web-speech',
            webSpeech: { lang: 'ja-JP', rate: 1.0, pitch: 1.0 }
          });
        }
      }

      // Check service status
      if (!llmService.getInitializationStatus()) {
        throw new Error(
          `${config.llm.provider} サービスが初期化されていません。API キーを確認してください。\n\n` +
          configService.generateExampleEnv()
        );
      }

      console.log('Services initialized successfully');
      console.log('LLM Provider:', llmService.getCurrentProvider());
      console.log('TTS Provider:', ttsProviderService.getCurrentProvider());

    } catch (error) {
      console.error('Service initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'サービスの初期化に失敗しました');
      
      Alert.alert(
        'サービス初期化エラー',
        error instanceof Error ? error.message : 'サービスの初期化に失敗しました。設定を確認してください。',
        [
          {
            text: '戻る',
            onPress: () => navigation.goBack(),
          },
          {
            text: '再試行',
            onPress: () => initializeServices(),
          },
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMessageSent = async (message: DialogueMessage) => {
    try {
      console.log('Message sent:', message);
      
      // Generate and play TTS if available
      if (message.sender === 'character' && ttsService.getInitializationStatus()) {
        try {
          const ttsResponse = await ttsService.synthesizeSpeech({
            text: message.text,
            characterId,
            emotion: message.emotion || 'neutral',
          });

          if (ttsResponse.success && ttsResponse.audioUrl) {
            setCurrentAudioUrl(ttsResponse.audioUrl);
            
            if (audioState.autoPlay) {
              await handleAudioPlay();
            }
          }
        } catch (ttsError) {
          console.warn('TTS generation failed:', ttsError);
          // Continue without audio
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  const handleEmotionChange = (emotion: string) => {
    console.log('Emotion changed to:', emotion);
    // Update character emotion in state if needed
  };

  // Audio control handlers
  const handleAudioPlay = async () => {
    if (currentAudioUrl) {
      const success = await audioService.playAudio({
        audioUrl: currentAudioUrl,
        characterId,
        volume: audioState.volume / 100,
        onPlaybackStart: () => setAudioState(prev => ({ ...prev, isPlaying: true })),
        onPlaybackComplete: () => setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 })),
        onPlaybackError: (error) => {
          console.error('Audio playback error:', error);
          setAudioState(prev => ({ ...prev, isPlaying: false }));
        }
      });
    }
  };

  const handleAudioPause = () => {
    audioService.pauseAudio();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleAudioStop = () => {
    audioService.stopAudio();
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  };

  const handleAudioSeek = (time: number) => {
    audioService.seekTo(time * 1000);
    setAudioState(prev => ({ ...prev, currentTime: time }));
  };

  const handleVolumeChange = (volume: number) => {
    audioService.setVolume(volume / 100);
    setAudioState(prev => ({ ...prev, volume }));
  };

  const handleSpeedChange = (speed: number) => {
    setAudioState(prev => ({ ...prev, speed }));
  };

  const handleLoopToggle = (loop: boolean) => {
    setAudioState(prev => ({ ...prev, isLooping: loop }));
  };

  const handleAutoPlayToggle = (autoPlay: boolean) => {
    setAudioState(prev => ({ ...prev, autoPlay }));
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>サービスを初期化しています...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (initError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>初期化エラー</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>キャラクターが見つかりません</Text>
          <Text style={styles.errorMessage}>
            キャラクター ID: {characterId}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{character.name}との対話</Text>
        <Text style={styles.headerSubtitle}>
          {character.description}
        </Text>
      </View>
      
      <View style={styles.dialogueContainer}>
        <EnhancedDialogueInterface
          characterId={characterId}
          userId={userId}
          onMessageSent={handleMessageSent}
          onEmotionChange={handleEmotionChange}
        />
      </View>

      {/* Audio Controller */}
      {currentAudioUrl && (
        <View style={styles.audioContainer}>
          <AudioController
            audioUrl={currentAudioUrl}
            isPlaying={audioState.isPlaying}
            volume={audioState.volume}
            speed={audioState.speed}
            currentTime={audioState.currentTime}
            duration={audioState.duration}
            isLooping={audioState.isLooping}
            autoPlay={audioState.autoPlay}
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onStop={handleAudioStop}
            onSeek={handleAudioSeek}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onLoopToggle={handleLoopToggle}
            onAutoPlayToggle={handleAutoPlayToggle}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  dialogueContainer: {
    flex: 1,
  },
  audioContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DialogueScreen;