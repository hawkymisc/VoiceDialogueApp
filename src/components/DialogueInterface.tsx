import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  DialogueMessage,
  ScenarioType,
  ConversationState,
} from '../types/Dialogue';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface DialogueInterfaceProps {
  conversation: ConversationState;
  onUserInput: (input: string) => void;
  onScenarioSelect: (scenario: ScenarioType) => void;
}

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  'daily-conversation': '日常会話',
  'work-scene': '仕事シーン',
  'special-event': '特別イベント',
  'emotional-scene': '感情的シーン',
  'comedy-scene': 'コメディシーン',
  'romantic-scene': 'ロマンチックシーン',
};

export const DialogueInterface: React.FC<DialogueInterfaceProps> = ({
  conversation,
  onUserInput,
  onScenarioSelect,
}) => {
  const [inputText, setInputText] = useState('');
  const [showScenarios, setShowScenarios] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Fade in animation when messages change
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [conversation.currentConversation?.messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      onUserInput(inputText.trim());
      setInputText('');
    }
  };

  const handleScenarioSelect = (scenario: ScenarioType) => {
    onScenarioSelect(scenario);
    setShowScenarios(false);
  };

  const renderMessage = ({item}: {item: DialogueMessage}) => {
    const isUser = item.speakerId === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.characterMessage,
        ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.speakerName}>
            {isUser ? 'あなた' : item.speakerId}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.characterMessageText,
          ]}>
          {item.text}
        </Text>

        {!isUser && (
          <View style={styles.messageMetadata}>
            <Text style={styles.emotionTag}>感情: {item.emotion}</Text>
            {item.metadata.isFavorite && (
              <Text style={styles.favoriteTag}>★</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderScenarioOption = ({item}: {item: ScenarioType}) => (
    <TouchableOpacity
      style={styles.scenarioOption}
      onPress={() => handleScenarioSelect(item)}>
      <Text style={styles.scenarioText}>{SCENARIO_LABELS[item]}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* Scenario Selection */}
      <Animated.View
        style={[styles.scenarioContainer, {opacity: showScenarios ? 1 : 0.9}]}>
        <TouchableOpacity
          style={styles.scenarioButton}
          onPress={() => setShowScenarios(!showScenarios)}>
          <Text style={styles.scenarioButtonText}>
            シナリオ選択 {showScenarios ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showScenarios && (
          <Animated.View
            style={[styles.scenarioListContainer, {opacity: fadeAnim}]}>
            <FlatList
              data={conversation.availableScenarios}
              renderItem={renderScenarioOption}
              keyExtractor={item => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scenarioList}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Messages Display */}
      <Animated.View style={[styles.messagesContainer, {opacity: fadeAnim}]}>
        {conversation.currentConversation?.messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>会話を始めましょう！</Text>
            <Text style={styles.emptyStateSubtext}>
              下のテキストボックスにメッセージを入力するか、
              シナリオを選択してください。
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={conversation.currentConversation?.messages || []}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted
            onContentSizeChange={() => {
              // Auto-scroll to latest message
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({offset: 0, animated: true});
              }
            }}
          />
        )}

        {/* Loading indicator */}
        {conversation.isGenerating && (
          <Animated.View style={[styles.loadingContainer, {opacity: fadeAnim}]}>
            <Text style={styles.loadingText}>
              {conversation.currentSpeaker}が考えています...
            </Text>
            <View style={styles.loadingDots}>
              <Text style={styles.loadingDot}>●</Text>
              <Text style={styles.loadingDot}>●</Text>
              <Text style={styles.loadingDot}>●</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!conversation.isGenerating}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <Text style={styles.characterCount}>{inputText.length}/500</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || conversation.isGenerating) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || conversation.isGenerating}>
          <Text
            style={[
              styles.sendButtonText,
              (!inputText.trim() || conversation.isGenerating) &&
                styles.sendButtonTextDisabled,
            ]}>
            送信
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {conversation.error && (
        <Animated.View style={[styles.errorContainer, {opacity: fadeAnim}]}>
          <Text style={styles.errorText}>{conversation.error}</Text>
          <TouchableOpacity
            style={styles.errorDismiss}
            onPress={() => {
              /* Handle error dismissal */
            }}>
            <Text style={styles.errorDismissText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scenarioContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scenarioButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  scenarioButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scenarioListContainer: {
    marginTop: 8,
  },
  scenarioList: {
    marginTop: 8,
  },
  scenarioOption: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scenarioText: {
    fontSize: 12,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  messagesList: {
    flex: 1,
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196f3',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  characterMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  characterMessageText: {
    color: '#333',
  },
  messageMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  emotionTag: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  favoriteTag: {
    fontSize: 14,
    color: '#ffc107',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    fontSize: 8,
    color: '#666',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
    maxHeight: 100,
  },
  characterCount: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorDismissText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
