import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectDialogueHistory,
  selectDialogueState,
  clearDialogueHistory,
  removeDialogueFromHistory,
  rateDialogue,
} from '../store/slices/dialogueSlice';
import {
  historyService,
  ConversationSaveData,
  HistorySettings,
} from '../services/historyService';
import {DialogueHistoryEntry} from '../types/Dialogue';
import {CharacterType} from '../types/Character';
import {SCENARIO_CATEGORIES} from '../data/scenarios';

interface ConversationHistoryProps {
  visible: boolean;
  onClose: () => void;
  onLoadConversation?: (conversation: ConversationSaveData) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  visible,
  onClose,
  onLoadConversation,
}) => {
  const dispatch = useDispatch();
  const dialogueHistory = useSelector(selectDialogueHistory);
  const dialogueState = useSelector(selectDialogueState);

  const [conversations, setConversations] = useState<ConversationSaveData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | 'all'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<HistorySettings>({
    maxHistoryCount: 50,
    autoSaveEnabled: true,
    compressionEnabled: true,
  });
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [loadedConversations, loadedSettings] = await Promise.all([
        historyService.loadConversations(),
        historyService.getSettings(),
      ]);
      
      setConversations(loadedConversations);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const conversationStats = await historyService.getConversationStats();
      setStats(conversationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await historyService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      dispatch(removeDialogueFromHistory(id));
    } catch (error) {
      Alert.alert('エラー', '会話の削除に失敗しました');
    }
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      '履歴の削除',
      '全ての会話履歴を削除しますか？この操作は取り消せません。',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await historyService.clearAllHistory();
              setConversations([]);
              dispatch(clearDialogueHistory());
            } catch (error) {
              Alert.alert('エラー', '履歴の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleLoadConversation = (conversation: ConversationSaveData) => {
    if (onLoadConversation) {
      onLoadConversation(conversation);
    }
    onClose();
  };

  const handleRateDialogue = async (dialogueId: string, rating: number) => {
    try {
      dispatch(rateDialogue({dialogueId, rating}));
      await historyService.addToHistory(
        dialogueHistory.find(entry => entry.id === dialogueId)!
      );
    } catch (error) {
      console.error('Error rating dialogue:', error);
    }
  };

  const handleExportHistory = async () => {
    try {
      const exportData = await historyService.exportHistory();
      Alert.alert('エクスポート完了', '履歴データをエクスポートしました');
    } catch (error) {
      Alert.alert('エラー', 'エクスポートに失敗しました');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<HistorySettings>) => {
    try {
      await historyService.updateSettings(newSettings);
      setSettings(prev => ({...prev, ...newSettings}));
    } catch (error) {
      Alert.alert('エラー', '設定の更新に失敗しました');
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    if (selectedCharacter !== 'all') {
      filtered = filtered.filter(conv => conv.characterId === selectedCharacter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.scenario.title.toLowerCase().includes(query) ||
        conv.scenario.description.toLowerCase().includes(query) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => b.metadata.lastActivity - a.metadata.lastActivity);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredConversations = getFilteredConversations();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>会話履歴</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                loadStats();
                setShowStats(true);
              }}>
              <Text style={styles.headerButtonText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSettings(true)}>
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}>
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="会話を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedCharacter === 'all' && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedCharacter('all')}>
              <Text style={styles.filterButtonText}>全て</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedCharacter === 'aoi' && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedCharacter('aoi')}>
              <Text style={styles.filterButtonText}>蒼</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedCharacter === 'shun' && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedCharacter('shun')}>
              <Text style={styles.filterButtonText}>瞬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation List */}
        <ScrollView style={styles.conversationList}>
          {filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => handleLoadConversation(conversation)}>
              <View style={styles.conversationHeader}>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationTitle}>
                    {conversation.scenario.title}
                  </Text>
                  <Text style={styles.conversationCharacter}>
                    {conversation.characterId === 'aoi' ? '蒼' : '瞬'}
                  </Text>
                </View>
                <View style={styles.conversationMeta}>
                  <Text style={styles.conversationDate}>
                    {formatDate(conversation.metadata.lastActivity)}
                  </Text>
                  <Text style={styles.conversationDuration}>
                    {formatDuration(conversation.metadata.duration)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.conversationDetails}>
                <Text
                  style={[
                    styles.conversationCategory,
                    {backgroundColor: SCENARIO_CATEGORIES[conversation.scenario.category].color},
                  ]}>
                  {SCENARIO_CATEGORIES[conversation.scenario.category].icon} {SCENARIO_CATEGORIES[conversation.scenario.category].name}
                </Text>
                <Text style={styles.conversationStats}>
                  {conversation.metadata.messageCount} メッセージ
                </Text>
              </View>

              <Text style={styles.conversationDescription} numberOfLines={2}>
                {conversation.scenario.description}
              </Text>

              <View style={styles.conversationActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteConversation(conversation.id)}>
                  <Text style={styles.deleteButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {filteredConversations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedCharacter !== 'all'
                  ? '該当する会話が見つかりません'
                  : '会話履歴がありません'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportHistory}>
            <Text style={styles.actionButtonText}>エクスポート</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearAllHistory}>
            <Text style={styles.actionButtonText}>全て削除</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>履歴設定</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>最大履歴数</Text>
                <TextInput
                  style={styles.settingInput}
                  value={settings.maxHistoryCount.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 50;
                    handleUpdateSettings({maxHistoryCount: num});
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>自動保存</Text>
                <Switch
                  value={settings.autoSaveEnabled}
                  onValueChange={(value) => handleUpdateSettings({autoSaveEnabled: value})}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>圧縮保存</Text>
                <Switch
                  value={settings.compressionEnabled}
                  onValueChange={(value) => handleUpdateSettings({compressionEnabled: value})}
                />
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSettings(false)}>
                <Text style={styles.modalCloseButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Stats Modal */}
        <Modal
          visible={showStats}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStats(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>統計情報</Text>
              
              {stats && (
                <View>
                  <Text style={styles.statItem}>
                    総会話数: {stats.totalConversations}
                  </Text>
                  <Text style={styles.statItem}>
                    総メッセージ数: {stats.totalMessages}
                  </Text>
                  <Text style={styles.statItem}>
                    平均メッセージ数: {stats.averageMessagesPerConversation.toFixed(1)}
                  </Text>
                  
                  <Text style={styles.statSectionTitle}>キャラクター別</Text>
                  {Object.entries(stats.characterDistribution).map(([charId, count]) => (
                    <Text key={charId} style={styles.statItem}>
                      {charId === 'aoi' ? '蒼' : '瞬'}: {count}回
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowStats(false)}>
                <Text style={styles.modalCloseButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerButtonText: {
    fontSize: 18,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  conversationList: {
    flex: 1,
    padding: 16,
  },
  conversationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  conversationCharacter: {
    fontSize: 14,
    color: '#666',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  conversationDuration: {
    fontSize: 12,
    color: '#999',
  },
  conversationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationCategory: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    fontWeight: 'bold',
  },
  conversationStats: {
    fontSize: 12,
    color: '#666',
  },
  conversationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  conversationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dangerButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default ConversationHistory;