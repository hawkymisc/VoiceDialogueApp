import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import {Character, EmotionState, CharacterType} from '../types/Character';
import {EmotionState as DialogueEmotionState} from '../types/Dialogue';
import {Live2DViewer} from './Live2DViewer';
import {useLive2D} from '../hooks/useLive2D';

const {width: screenWidth} = Dimensions.get('window');

export type InteractionType = 'tap' | 'long-press' | 'swipe';

export interface CharacterDisplayProps {
  character: Character;
  emotion: EmotionState;
  isActive: boolean;
  isSpeaking?: boolean;
  lipSyncData?: ArrayBuffer;
  useLive2D?: boolean;
  onInteraction: (interaction: InteractionType) => void;
  onModelLoaded?: (characterId: CharacterType) => void;
  onLive2DError?: (error: string) => void;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  character,
  emotion,
  isActive,
  isSpeaking = false,
  lipSyncData,
  useLive2D = false,
  onInteraction,
  onModelLoaded,
  onLive2DError,
}) => {
  const [animationValue] = useState(new Animated.Value(0));
  const [breathingAnimation] = useState(new Animated.Value(0));
  const [showLive2D, setShowLive2D] = useState(useLive2D);
  
  // Live2D integration
  const {
    currentModel,
    isLoading: isLive2DLoading,
    error: live2dError,
    playTalkingAnimation,
    playEmotionSequence,
    playIdleAnimation,
    startLipSyncWithAudio,
    stopLipSyncAnimation,
  } = useLive2D();

  useEffect(() => {
    // Breathing animation for idle state
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );
    breathingLoop.start();

    return () => breathingLoop.stop();
  }, []);

  useEffect(() => {
    // Speaking animation
    if (isSpeaking) {
      const speakingLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      );
      speakingLoop.start();
    } else {
      animationValue.setValue(0);
    }
  }, [isSpeaking]);

  // Handle Live2D error
  useEffect(() => {
    if (live2dError) {
      onLive2DError?.(live2dError);
    }
  }, [live2dError, onLive2DError]);

  // Map character emotion to Live2D emotion
  const mapEmotionToLive2D = (emotion: EmotionState): DialogueEmotionState => {
    switch (emotion.primary) {
      case 'joy':
      case 'excited':
        return 'happy';
      case 'sadness':
        return 'sad';
      case 'anger':
        return 'angry';
      case 'surprise':
        return 'surprised';
      case 'embarrassed':
        return 'embarrassed';
      case 'fear':
        return 'sad';
      default:
        return 'neutral';
    }
  };

  // Handle Live2D animations based on state
  useEffect(() => {
    if (useLive2D && currentModel) {
      const dialogueEmotion = mapEmotionToLive2D(emotion);
      
      if (isSpeaking) {
        playTalkingAnimation(lipSyncData);
      } else {
        playEmotionSequence(dialogueEmotion);
      }
    }
  }, [isSpeaking, emotion, currentModel, useLive2D, lipSyncData, playTalkingAnimation, playEmotionSequence]);

  // Handle lip sync
  useEffect(() => {
    if (useLive2D && currentModel) {
      if (isSpeaking && lipSyncData) {
        startLipSyncWithAudio(lipSyncData);
      } else {
        stopLipSyncAnimation();
      }
    }
  }, [isSpeaking, lipSyncData, currentModel, useLive2D, startLipSyncWithAudio, stopLipSyncAnimation]);

  const handlePress = () => {
    onInteraction('tap');
  };

  const handleLongPress = () => {
    onInteraction('long-press');
  };

  const getEmotionExpression = () => {
    const expressions = character.appearance.expressions;
    switch (emotion.primary) {
      case 'joy':
      case 'excited':
        return expressions.happy;
      case 'sadness':
        return expressions.sad;
      case 'anger':
        return expressions.angry;
      case 'surprise':
        return expressions.surprised;
      case 'embarrassed':
        return expressions.embarrassed;
      default:
        return expressions.neutral;
    }
  };

  const getEmotionColor = (emotionType: string) => {
    switch (emotionType) {
      case 'joy':
      case 'excited':
        return '#4caf50'; // Green
      case 'sadness':
        return '#2196f3'; // Blue
      case 'anger':
        return '#f44336'; // Red
      case 'surprise':
        return '#ff9800'; // Orange
      case 'embarrassed':
        return '#e91e63'; // Pink
      case 'fear':
        return '#9c27b0'; // Purple
      default:
        return '#757575'; // Gray
    }
  };

  const getCharacterStyle = () => {
    return [
      styles.characterContainer,
      isActive && styles.activeCharacter,
      {opacity: emotion.intensity > 0.7 ? 1 : 0.8},
    ];
  };

  return (
    <TouchableOpacity
      style={getCharacterStyle()}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}>
      <View style={styles.characterImageContainer}>
        {/* Live2D Model Container or Static Image */}
        {useLive2D ? (
          <View style={styles.live2dContainer}>
            <Live2DViewer
              characterId={character.id as CharacterType}
              emotion={mapEmotionToLive2D(emotion)}
              isVisible={isActive}
              enableInteraction={isActive}
              enableAutoAnimation={!isSpeaking}
              style={styles.live2dViewer}
              onModelLoaded={onModelLoaded}
              onError={onLive2DError}
            />
            
            {/* Loading overlay */}
            {isLive2DLoading && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          </View>
        ) : (
          <Animated.View
            style={[
              styles.live2dContainer,
              {
                transform: [
                  {
                    scale: breathingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }),
                  },
                ],
              },
            ]}>
            <Image
              source={{uri: getEmotionExpression()}}
              style={[
                styles.characterImage,
                isSpeaking && styles.speakingCharacter,
              ]}
              resizeMode="contain"
            />

            {/* Lip Sync Indicator */}
            {isSpeaking && (
              <Animated.View
                style={[
                  styles.lipSyncIndicator,
                  {
                    opacity: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ]}>
                <Text style={styles.lipSyncText}>💬</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Emotion indicator */}
        <View style={styles.emotionIndicator}>
          <Text style={styles.emotionText}>{emotion.primary}</Text>
          <View
            style={[
              styles.intensityBar,
              {
                width: `${emotion.intensity * 100}%`,
                backgroundColor: getEmotionColor(emotion.primary),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.characterInfo}>
        <Text style={styles.characterName}>{character.name}</Text>
        <Text style={styles.characterAge}>年齢: {character.age}歳</Text>

        {/* Personality traits display */}
        <View style={styles.personalityContainer}>
          <Text style={styles.personalityLabel}>性格:</Text>
          <View style={styles.personalityTraits}>
            <Text style={styles.traitText}>
              積極性: {character.personality.aggressiveness}
            </Text>
            <Text style={styles.traitText}>
              優しさ: {character.personality.kindness}
            </Text>
            <Text style={styles.traitText}>
              ツンデレ度: {character.personality.tsundereLevel}
            </Text>
            <Text style={styles.traitText}>
              照れやすさ: {character.personality.shyness}
            </Text>
          </View>
        </View>
      </View>

      {/* Active indicator */}
      {isActive && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeText}>話し中</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  characterContainer: {
    width: screenWidth * 0.45,
    backgroundColor: '#f8f9fa',
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
  activeCharacter: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  characterImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  live2dContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  characterImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  speakingCharacter: {
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  lipSyncIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lipSyncText: {
    fontSize: 12,
    color: 'white',
  },
  emotionIndicator: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  emotionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  intensityBar: {
    height: 4,
    backgroundColor: '#2196f3',
    borderRadius: 2,
    maxWidth: '100%',
  },
  characterInfo: {
    alignItems: 'center',
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  characterAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  personalityContainer: {
    width: '100%',
  },
  personalityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  personalityTraits: {
    gap: 2,
  },
  traitText: {
    fontSize: 10,
    color: '#666',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  live2dViewer: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
