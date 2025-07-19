import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Modal,
  ScrollView,
} from 'react-native';
import {conversationService} from '../services/conversationService';
import {
  Conversation,
  ConversationFilter,
  ConversationStats,
  ConversationSummary,
} from '../services/conversationService';
import {CharacterType} from '../types/Character';
import {EmotionType} from '../types/Dialogue';

interface ConversationHistoryManagerProps {
  visible: boolean;
  onClose: () => void;
  onConversationSelect?: (conversation: Conversation) => void;
  userId: string;
}

const ConversationHistoryManager: React.FC<ConversationHistoryManagerProps> = ({
  visible,
  onClose,
  onConversationSelect,
  userId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'aoi' | 'shun'>('all');
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'length' | 'rating'>('date');

  useEffect(() => {
    if (visible) {
      loadConversations();
      loadStats();
    }
  }, [visible]);

  useEffect(() => {
    applyFilters();
  }, [conversations, searchQuery, selectedFilter, sortBy]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const searchResult = await conversationService.searchConversations({
        query: '',
        filters: {},
        sortBy: 'date',
        sortOrder: 'desc',
      });
      setConversations(searchResult);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert('エラー', '会話履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await conversationService.getConversationStats(userId);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conversation =>
        conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Character filter
    if (selectedFilter === 'aoi') {
      filtered = filtered.filter(c => c.characterId === 'aoi');
    } else if (selectedFilter === 'shun') {
      filtered = filtered.filter(c => c.characterId === 'shun');
    } else if (selectedFilter === 'favorites') {
      filtered = filtered.filter(c => c.isFavorite);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        case 'length':
          return b.messages.length - a.messages.length;
        case 'rating':
          return (b.metadata.userSatisfaction || 0) - (a.metadata.userSatisfaction || 0);
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  };

  const handleConversationPress = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversationDetail(true);
    
    // Generate summary if not exists
    try {
      const summary = await conversationService.generateSummary(conversation.id);
      setConversationSummary(summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const handleToggleFavorite = async (conversationId: string) => {
    try {
      await conversationService.toggleFavorite(conversationId);
      loadConversations();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('エラー', 'お気に入りの更新に失敗しました');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      '削除確認',
      'この会話を削除しますか？この操作は取り消せません。',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await conversationService.deleteConversation(conversationId);
              loadConversations();
              if (selectedConversation?.id === conversationId) {
                setShowConversationDetail(false);
              }
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('エラー', '会話の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleExportConversation = async (conversation: Conversation) => {
    try {
      const exportData = await conversationService.exportConversations([conversation.id]);
      await Share.share({
        message: exportData,
        title: `会話履歴: ${conversation.title}`,
      });
    } catch (error) {
      console.error('Failed to export conversation:', error);
      Alert.alert('エラー', '会話のエクスポートに失敗しました');
    }
  };

  const getCharacterName = (characterId: CharacterType): string => {
    return characterId === 'aoi' ? '蒼' : '瞬';
  };

  const getEmotionColor = (emotion: EmotionType): string => {
    const colors: Record<EmotionType, string> = {
      neutral: '#757575',
      happy: '#4CAF50',
      sad: '#2196F3',
      angry: '#F44336',
      surprised: '#FF9800',
      embarrassed: '#E91E63',
    };
    return colors[emotion] || '#757575';
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `今日 ${date.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}`;
    } else if (diffDays === 1) {
      return `昨日 ${date.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const renderConversationItem = ({item}: {item: Conversation}) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          <Text style={styles.characterName}>
            {getCharacterName(item.characterId)}との会話
          </Text>
        </View>
        <View style={styles.conversationActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Text style={styles.favoriteIcon}>
              {item.isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.conversationSummary} numberOfLines={2}>
        {item.summary || '会話の概要はまだ生成されていません'}
      </Text>
      
      <View style={styles.conversationMeta}>
        <Text style={styles.metaText}>
          {item.messages.length}メッセージ
        </Text>
        <Text style={styles.metaText}>
          {formatDate(new Date(item.lastMessageAt))}
        </Text>
        {item.metadata.userSatisfaction && (
          <Text style={styles.rating}>
            ⭐ {item.metadata.userSatisfaction.toFixed(1)}
          </Text>
        )}
      </View>

      {item.metadata.emotionalArc.length > 0 && (
        <View style={styles.emotionBar}>
          {item.metadata.emotionalArc.slice(-3).map((arc, index) => (
            <View
              key={index}
              style={[
                styles.emotionDot,
                {backgroundColor: getEmotionColor(arc.emotion)},
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (
    filter: 'all' | 'favorites' | 'aoi' | 'shun',
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonSelected,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextSelected,
        ]}
      >
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>会話履歴</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => setShowStats(true)}
            >
              <Text style={styles.statsButtonText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="会話を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilterButton('all', 'すべて', '📚')}
            {renderFilterButton('favorites', 'お気に入り', '❤️')}
            {renderFilterButton('aoi', '蒼', '👨')}
            {renderFilterButton('shun', '瞬', '👨‍💼')}
          </ScrollView>
        </View>

        {/* Sort options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>並び順:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonSelected]}
            onPress={() => setSortBy('date')}
          >
            <Text style={styles.sortButtonText}>日付</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'length' && styles.sortButtonSelected]}
            onPress={() => setSortBy('length')}
          >
            <Text style={styles.sortButtonText}>長さ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonSelected]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={styles.sortButtonText}>評価</Text>
          </TouchableOpacity>
        </View>

        {/* Conversations list */}
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>読み込み中...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? '条件に合う会話が見つかりませんでした' : '会話履歴がありません'}
                </Text>
              </View>
            )
          }
        />

        {/* Conversation Detail Modal */}
        <Modal
          visible={showConversationDetail}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowConversationDetail(false)}
        >
          {selectedConversation && (
            <View style={styles.detailContainer}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedConversation.title}</Text>
                <TouchableOpacity
                  onPress={() => setShowConversationDetail(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailContent}>
                {conversationSummary && (
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>概要</Text>
                    <Text style={styles.summaryText}>{conversationSummary.content}</Text>
                    
                    {conversationSummary.keyTopics.length > 0 && (
                      <View style={styles.topicsSection}>
                        <Text style={styles.subsectionTitle}>主なトピック</Text>
                        <View style={styles.topicsList}>
                          {conversationSummary.keyTopics.map((topic, index) => (
                            <Text key={index} style={styles.topicItem}>
                              • {topic}
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.messagesSection}>
                  <Text style={styles.sectionTitle}>メッセージ ({selectedConversation.messages.length})</Text>
                  {selectedConversation.messages.map((message, index) => (
                    <View key={message.id} style={styles.messageItem}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageSender}>
                          {message.sender === 'user' ? 'あなた' : getCharacterName(selectedConversation.characterId)}
                        </Text>
                        <Text style={styles.messageTime}>
                          {new Date(message.timestamp).toLocaleTimeString('ja-JP')}
                        </Text>
                      </View>
                      <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleExportConversation(selectedConversation)}
                >
                  <Text style={styles.actionButtonText}>📤 共有</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteConversation(selectedConversation.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ 削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>

        {/* Stats Modal */}
        <Modal
          visible={showStats}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStats(false)}
        >
          {stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statsHeader}>
                <Text style={styles.statsTitle}>統計情報</Text>
                <TouchableOpacity
                  onPress={() => setShowStats(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.statsContent}>
                <View style={styles.statsSection}>
                  <Text style={styles.statItem}>
                    📚 総会話数: {stats.totalConversations}
                  </Text>
                  <Text style={styles.statItem}>
                    💬 総メッセージ数: {stats.totalMessages}
                  </Text>
                  <Text style={styles.statItem}>
                    📏 平均会話長: {stats.averageLength.toFixed(1)}メッセージ
                  </Text>
                  {stats.favoriteCharacter && (
                    <Text style={styles.statItem}>
                      ❤️ お気に入りキャラクター: {getCharacterName(stats.favoriteCharacter)}
                    </Text>
                  )}
                </View>

                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>感情分布</Text>
                  {Object.entries(stats.emotionDistribution).map(([emotion, count]) => (
                    <View key={emotion} style={styles.emotionStat}>
                      <Text style={styles.emotionLabel}>{emotion}</Text>
                      <Text style={styles.emotionCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statsButtonText: {
    fontSize: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  sortButtonSelected: {
    backgroundColor: '#E3F2FD',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#333333',
    marginBottom: 2,
  },
  characterName: {
    fontSize: 12,
    color: '#666666',
  },
  conversationActions: {
    flexDirection: 'row',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  conversationSummary: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999999',
  },
  rating: {
    fontSize: 12,
    color: '#FF9800',
  },
  emotionBar: {
    flexDirection: 'row',
    marginTop: 4,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  topicsSection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  topicsList: {
    marginLeft: 8,
  },
  topicItem: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  messagesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  messageItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  detailActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#D32F2F',
  },
  statsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  statsContent: {
    flex: 1,
    padding: 16,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  emotionStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  emotionLabel: {
    fontSize: 14,
    color: '#666666',
  },
  emotionCount: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
});

export default ConversationHistoryManager;