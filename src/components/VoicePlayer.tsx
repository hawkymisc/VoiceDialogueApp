import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {AudioController} from './AudioController';
import {audioPlayerService, AudioTrack, PlaybackState, PlaybackProgress} from '../services/audioPlayerService';
import {ttsService, TTSRequest} from '../services/ttsService';
import {CharacterType} from '../types/Character';
import {EmotionState} from '../types/Dialogue';

export interface VoicePlayerProps {
  text: string;
  characterId: CharacterType;
  emotion: EmotionState;
  autoPlay?: boolean;
  onPlaybackComplete?: () => void;
  onPlaybackError?: (error: string) => void;
  style?: any;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  text,
  characterId,
  emotion,
  autoPlay = false,
  onPlaybackComplete,
  onPlaybackError,
  style,
}) => {
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
  });
  const [playbackProgress, setPlaybackProgress] = useState<PlaybackProgress>({
    currentTime: 0,
    duration: 0,
    progress: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);

  // Generate audio when text, character, or emotion changes
  useEffect(() => {
    if (text && characterId && emotion) {
      generateAudio();
    }
  }, [text, characterId, emotion]);

  // Auto-play when audio is ready
  useEffect(() => {
    if (audioTrack && autoPlayEnabled && !playbackState.isPlaying) {
      handlePlay();
    }
  }, [audioTrack, autoPlayEnabled]);

  // Setup playback callbacks
  useEffect(() => {
    const handleStateChange = (state: PlaybackState) => {
      setPlaybackState(state);
      
      if (state.error) {
        onPlaybackError?.(state.error);
      }
      
      if (!state.isPlaying && !state.isPaused && !state.isLoading) {
        // Playback completed
        if (isLooping && audioTrack) {
          // Restart playback if looping
          setTimeout(() => {
            handlePlay();
          }, 500);
        } else {
          onPlaybackComplete?.();
        }
      }
    };

    const handleProgress = (progress: PlaybackProgress) => {
      setPlaybackProgress(progress);
    };

    audioPlayerService.addStateChangeCallback(handleStateChange);
    audioPlayerService.addProgressCallback(handleProgress);

    return () => {
      audioPlayerService.removeStateChangeCallback(handleStateChange);
      audioPlayerService.removeProgressCallback(handleProgress);
    };
  }, [isLooping, audioTrack, onPlaybackComplete, onPlaybackError]);

  // Update audio player config when volume or speed changes
  useEffect(() => {
    audioPlayerService.updateConfig({
      volume: volume / 100,
      speed,
    });
  }, [volume, speed]);

  const generateAudio = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
      const ttsRequest: TTSRequest = {
        text: text.trim(),
        characterId,
        emotion,
      };

      const response = await ttsService.synthesizeSpeech(ttsRequest);
      
      if (response.success) {
        const track: AudioTrack = {
          id: `${characterId}_${emotion}_${Date.now()}`,
          audioUrl: response.audioUrl,
          audioData: response.audioData,
          text: text.trim(),
          characterId,
          emotion,
          duration: response.duration,
        };

        setAudioTrack(track);
      } else {
        throw new Error(response.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      Alert.alert(
        'エラー',
        '音声の生成に失敗しました。もう一度お試しください。',
        [{ text: 'OK' }]
      );
      onPlaybackError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = useCallback(async () => {
    if (!audioTrack) {
      await generateAudio();
      return;
    }

    try {
      if (playbackState.isPaused) {
        await audioPlayerService.resumeAudio();
      } else {
        await audioPlayerService.playAudio(audioTrack);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('エラー', '音声の再生に失敗しました。');
    }
  }, [audioTrack, playbackState.isPaused]);

  const handlePause = useCallback(async () => {
    try {
      await audioPlayerService.pauseAudio();
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await audioPlayerService.stopAudio();
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }, []);

  const handleSeek = useCallback(async (positionMs: number) => {
    try {
      await audioPlayerService.seekTo(positionMs);
    } catch (error) {
      console.error('Failed to seek audio:', error);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    audioPlayerService.setVolume(newVolume / 100);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    audioPlayerService.setSpeed(newSpeed);
  }, []);

  const handleLoopToggle = useCallback((loop: boolean) => {
    setIsLooping(loop);
  }, []);

  const handleAutoPlayToggle = useCallback((autoPlayValue: boolean) => {
    setAutoPlayEnabled(autoPlayValue);
  }, []);

  const handleRegenerate = useCallback(() => {
    Alert.alert(
      '音声の再生成',
      '新しい音声を生成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '生成', 
          onPress: () => {
            setAudioTrack(null);
            generateAudio();
          }
        }
      ]
    );
  }, []);

  const getCharacterName = (charId: CharacterType): string => {
    return charId === 'aoi' ? '蒼' : '瞬';
  };

  const getEmotionText = (emotionState: EmotionState): string => {
    const emotionMap: Record<EmotionState, string> = {
      neutral: '普通',
      happy: '嬉しい',
      sad: '悲しい',
      angry: '怒り',
      surprised: '驚き',
      embarrassed: '恥ずかしい',
    };
    return emotionMap[emotionState] || '普通';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{getCharacterName(characterId)}</Text>
          <Text style={styles.emotionText}>({getEmotionText(emotion)})</Text>
        </View>
        <TouchableOpacity 
          style={styles.regenerateButton}
          onPress={handleRegenerate}
          disabled={isGenerating}>
          <Text style={styles.regenerateButtonText}>
            {isGenerating ? '生成中...' : '再生成'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Text Display */}
      <View style={styles.textContainer}>
        <Text style={styles.dialogueText}>{text}</Text>
      </View>

      {/* Loading Indicator */}
      {isGenerating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>音声を生成しています...</Text>
        </View>
      )}

      {/* Audio Controller */}
      {!isGenerating && (
        <AudioController
          audioUrl={audioTrack?.audioUrl || ''}
          isPlaying={playbackState.isPlaying}
          volume={volume}
          speed={speed}
          currentTime={playbackProgress.currentTime / 1000} // Convert to seconds
          duration={playbackProgress.duration / 1000} // Convert to seconds
          isLooping={isLooping}
          autoPlay={autoPlayEnabled}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={(timeSeconds) => handleSeek(timeSeconds * 1000)} // Convert to milliseconds
          onVolumeChange={handleVolumeChange}
          onSpeedChange={handleSpeedChange}
          onLoopToggle={handleLoopToggle}
          onAutoPlayToggle={handleAutoPlayToggle}
        />
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isGenerating 
            ? '音声を生成中...' 
            : audioTrack 
              ? playbackState.isPlaying ? '再生中' : '再生準備完了'
              : '音声が生成されていません'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emotionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  regenerateButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  regenerateButtonText: {
    fontSize: 12,
    color: '#666',
  },
  textContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dialogueText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default VoicePlayer;