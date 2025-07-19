import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {openaiService} from '../services/openaiService';
import {conversationService} from '../services/conversationService';
import {scenarioService} from '../services/scenarioService';
import {CharacterType} from '../types/Character';
import {DialogueMessage, EmotionType} from '../types/Dialogue';
import {Scenario} from '../types/Scenario';
import {RootState} from '../store';
import {addDialogueMessage, setCurrentEmotion} from '../store/slices/dialogueSlice';
import EnhancedScenarioSelector from './EnhancedScenarioSelector';

interface EnhancedDialogueInterfaceProps {
  characterId: CharacterType;
  userId: string;
  onMessageSent?: (message: DialogueMessage) => void;
  onEmotionChange?: (emotion: EmotionType) => void;
}

const EnhancedDialogueInterface: React.FC<EnhancedDialogueInterfaceProps> = ({
  characterId,
  userId,
  onMessageSent,
  onEmotionChange,
}) => {
  const dispatch = useDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {messages, currentEmotion, scenario: currentScenario} = useSelector(
    (state: RootState) => state.dialogue
  );
  const character = useSelector((state: RootState) => 
    state.character.characters.find(c => c.id === characterId)
  );

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [conversationProgress, setConversationProgress] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    startNewConversation();
  }, [characterId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const startNewConversation = async () => {
    try {
      const conversation = await conversationService.createConversation(
        characterId,
        selectedScenario?.id,
        selectedScenario?.title
      );
      setCurrentConversationId(conversation.id);
      
      if (selectedScenario) {
        // Add initial scenario message
        const initialMessage: Omit<DialogueMessage, 'id' | 'timestamp'> = {
          text: selectedScenario.conversation_starters[0] || 'こんにちは！',
          sender: 'character',
          emotion: selectedScenario.context.mood,
          characterId,
        };

        const message = await conversationService.addMessage(conversation.id, initialMessage);
        if (message) {
          dispatch(addDialogueMessage(message));
          onMessageSent?.(message);
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioSelector(false);
    startNewConversation();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add user message to conversation
      if (currentConversationId) {
        const userMessageObj: Omit<DialogueMessage, 'id' | 'timestamp'> = {
          text: userMessage,
          sender: 'user',
          emotion: 'neutral',
        };

        const savedUserMessage = await conversationService.addMessage(
          currentConversationId,
          userMessageObj
        );
        if (savedUserMessage) {
          dispatch(addDialogueMessage(savedUserMessage));
        }
      }

      // Generate character response
      const conversationHistory = messages.slice(-10); // Last 10 messages for context
      
      const dialogueRequest = {
        characterId,
        userMessage,
        conversationHistory,
        scenario: selectedScenario?.title,
        relationshipContext: selectedScenario?.context.relationship_stage,
        personalityTraits: character ? {
          積極性: character.personality.aggressiveness,
          優しさ: character.personality.kindness,
          ツンデレ度: character.personality.tsundere,
          照れやすさ: character.personality.shyness,
        } : undefined,
      };

      const response = await openaiService.generateDialogue(dialogueRequest);

      // Add character response to conversation
      if (currentConversationId) {
        const characterMessage: Omit<DialogueMessage, 'id' | 'timestamp'> = {
          text: response.text,
          sender: 'character',
          emotion: response.emotion,
          characterId,
        };

        const savedCharacterMessage = await conversationService.addMessage(
          currentConversationId,
          characterMessage
        );
        
        if (savedCharacterMessage) {
          dispatch(addDialogueMessage(savedCharacterMessage));
          dispatch(setCurrentEmotion(response.emotion));
          onMessageSent?.(savedCharacterMessage);
          onEmotionChange?.(response.emotion);
        }
      }

      // Update scenario progress if applicable
      if (selectedScenario && conversationProgress) {
        await scenarioService.updateProgress(userId, selectedScenario.id, {
          dialogue_count: conversationProgress.dialogue_count + 1,
          emotions_triggered: [
            ...conversationProgress.emotions_triggered,
            response.emotion,
          ],
        });
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('エラー', 'メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleCompleteScenario = async () => {
    if (!selectedScenario || !conversationProgress) return;

    Alert.alert(
      'シナリオ完了',
      'このシナリオを完了しますか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '完了',
          onPress: async () => {
            try {
              await scenarioService.completeScenario(userId, selectedScenario.id, 5);
              Alert.alert('完了', 'シナリオが完了しました！');
              setSelectedScenario(null);
              setConversationProgress(null);
            } catch (error) {
              console.error('Failed to complete scenario:', error);
            }
          },
        },
      ]
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const getEmotionColor = (emotion: EmotionType): string => {
    const emotionColors: Record<EmotionType, string> = {
      neutral: '#757575',
      happy: '#4CAF50',
      sad: '#2196F3',
      angry: '#F44336',
      surprised: '#FF9800',
      embarrassed: '#E91E63',
    };
    return emotionColors[emotion] || '#757575';
  };

  const getEmotionIcon = (emotion: EmotionType): string => {
    const emotionIcons: Record<EmotionType, string> = {
      neutral: '😐',
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      embarrassed: '😳',
    };
    return emotionIcons[emotion] || '😐';
  };

  const renderMessage = (message: DialogueMessage, index: number) => {
    const isCharacterMessage = message.sender === 'character';
    
    return (
      <View
        key={`${message.id}-${index}`}
        style={[
          styles.messageContainer,
          isCharacterMessage ? styles.characterMessage : styles.userMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCharacterMessage ? styles.characterBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCharacterMessage ? styles.characterText : styles.userText,
            ]}
          >
            {message.text}
          </Text>
          {isCharacterMessage && message.emotion && (
            <View style={styles.emotionIndicator}>
              <Text style={styles.emotionIcon}>
                {getEmotionIcon(message.emotion)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.characterName}>
            {character?.name || (characterId === 'aoi' ? '蒼' : '瞬')}
          </Text>
          {selectedScenario && (
            <Text style={styles.scenarioTitle}>{selectedScenario.title}</Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.scenarioButton}
            onPress={() => setShowScenarioSelector(true)}
          >
            <Text style={styles.scenarioButtonText}>📝</Text>
          </TouchableOpacity>
          {selectedScenario && conversationProgress && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteScenario}
            >
              <Text style={styles.completeButtonText}>✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current emotion indicator */}
      {currentEmotion && (
        <View style={styles.emotionBar}>
          <View
            style={[
              styles.emotionIndicatorBar,
              {backgroundColor: getEmotionColor(currentEmotion)},
            ]}
          >
            <Text style={styles.emotionText}>
              {getEmotionIcon(currentEmotion)} {currentEmotion}
            </Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.characterMessage]}>
            <View style={[styles.messageBubble, styles.characterBubble]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>入力中</Text>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          multiline
          maxLength={200}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>送信</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Scenario Selector Modal */}
      <EnhancedScenarioSelector
        visible={showScenarioSelector}
        characterId={characterId}
        userId={userId}
        onScenarioSelect={handleScenarioSelect}
        onClose={() => setShowScenarioSelector(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  scenarioTitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  scenarioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  scenarioButtonText: {
    fontSize: 16,
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  emotionBar: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  emotionIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emotionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  characterMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    position: 'relative',
  },
  characterBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  characterText: {
    color: '#333333',
  },
  userText: {
    color: '#FFFFFF',
  },
  emotionIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  emotionIcon: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedDialogueInterface;