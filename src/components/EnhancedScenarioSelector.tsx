import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {scenarioService} from '../services/scenarioService';
import {Scenario, ScenarioCategory, ScenarioDifficulty, ScenarioRecommendation} from '../types/Scenario';
import {CharacterType} from '../types/Character';
import {setDialogueScenario} from '../store/slices/dialogueSlice';

interface EnhancedScenarioSelectorProps {
  characterId: CharacterType;
  onScenarioSelect: (scenario: Scenario) => void;
  onClose: () => void;
  visible: boolean;
  userId?: string;
}

const EnhancedScenarioSelector: React.FC<EnhancedScenarioSelectorProps> = ({
  characterId,
  onScenarioSelect,
  onClose,
  visible,
  userId,
}) => {
  const dispatch = useDispatch();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([]);
  const [recommendations, setRecommendations] = useState<ScenarioRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ScenarioDifficulty | 'all'>('all');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const categories: Array<{key: ScenarioCategory | 'all'; label: string; icon: string}> = [
    {key: 'all', label: 'すべて', icon: '📚'},
    {key: 'daily', label: '日常', icon: '💬'},
    {key: 'work', label: '仕事', icon: '💼'},
    {key: 'romantic', label: 'ロマンス', icon: '💕'},
    {key: 'comedy', label: 'コメディ', icon: '😄'},
    {key: 'drama', label: 'ドラマ', icon: '🎭'},
    {key: 'special', label: '特別', icon: '🎉'},
    {key: 'seasonal', label: '季節', icon: '🌸'},
  ];

  const difficulties: Array<{key: ScenarioDifficulty | 'all'; label: string; color: string}> = [
    {key: 'all', label: 'すべて', color: '#757575'},
    {key: 'beginner', label: '初級', color: '#4CAF50'},
    {key: 'intermediate', label: '中級', color: '#FF9800'},
    {key: 'advanced', label: '上級', color: '#F44336'},
  ];

  useEffect(() => {
    if (visible) {
      loadScenarios();
      if (userId) {
        loadRecommendations();
      }
    }
  }, [visible, characterId, userId]);

  useEffect(() => {
    applyFilters();
  }, [scenarios, searchQuery, selectedCategory, selectedDifficulty]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const allScenarios = await scenarioService.getAllScenarios();
      const compatibleScenarios = allScenarios.filter(scenario =>
        scenario.compatible_characters.includes(characterId)
      );
      setScenarios(compatibleScenarios);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      Alert.alert('エラー', 'シナリオの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!userId) return;

    try {
      const recs = await scenarioService.getRecommendations(userId, characterId, 5);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...scenarios];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(scenario =>
        scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.suggested_topics.some(topic =>
          topic.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(scenario => scenario.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(scenario => scenario.difficulty === selectedDifficulty);
    }

    // Show unlocked scenarios first
    filtered.sort((a, b) => {
      if (a.is_unlocked && !b.is_unlocked) return -1;
      if (!a.is_unlocked && b.is_unlocked) return 1;
      return b.usage_count - a.usage_count; // Then by popularity
    });

    setFilteredScenarios(filtered);
  };

  const handleScenarioSelect = async (scenario: Scenario) => {
    setSelectedScenario(scenario);
    
    // Update usage analytics
    if (userId) {
      try {
        await scenarioService.startScenario(userId, scenario.id);
      } catch (error) {
        console.error('Failed to start scenario:', error);
      }
    }

    // Convert to DialogueScenario format for compatibility
    const dialogueScenario = {
      id: scenario.id,
      category: scenario.category,
      title: scenario.title,
      description: scenario.description,
      initialPrompt: scenario.conversation_starters[0] || 'こんにちは',
      tags: scenario.suggested_topics,
      difficulty: scenario.difficulty === 'beginner' ? 'easy' : 
                 scenario.difficulty === 'intermediate' ? 'medium' : 'hard',
      contextSettings: {
        timeOfDay: scenario.context.timeOfDay,
        location: scenario.context.location,
        mood: scenario.context.mood,
      },
    };

    dispatch(setDialogueScenario(dialogueScenario));
    onScenarioSelect(scenario);
    onClose();
  };

  const handleRandomScenario = () => {
    const availableScenarios = filteredScenarios.filter(s => s.is_unlocked);
    if (availableScenarios.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableScenarios.length);
      handleScenarioSelect(availableScenarios[randomIndex]);
    }
  };

  const toggleFavorite = async (scenario: Scenario) => {
    try {
      await scenarioService.toggleFavorite(scenario.id);
      // Reload scenarios to reflect changes
      loadScenarios();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getDifficultyColor = (difficulty: ScenarioDifficulty): string => {
    const difficultyData = difficulties.find(d => d.key === difficulty);
    return difficultyData?.color || '#757575';
  };

  const getCategoryIcon = (category: ScenarioCategory): string => {
    const categoryData = categories.find(c => c.key === category);
    return categoryData?.icon || '📝';
  };

  const renderScenarioItem = ({item}: {item: Scenario}) => (
    <TouchableOpacity
      style={[
        styles.scenarioItem,
        !item.is_unlocked && styles.lockedScenarioItem,
        selectedScenario?.id === item.id && styles.selectedScenarioItem,
      ]}
      onPress={() => item.is_unlocked && handleScenarioSelect(item)}
      disabled={!item.is_unlocked}
      accessible={true}
      accessibilityLabel={`シナリオ: ${item.title}`}
      accessibilityHint={item.is_unlocked ? "タップして選択" : "ロック中"}
    >
      <View style={styles.scenarioHeader}>
        <View style={styles.scenarioTitleContainer}>
          <View style={styles.scenarioTitleRow}>
            <Text style={styles.scenarioCategory}>
              {getCategoryIcon(item.category)}
            </Text>
            <Text style={[styles.scenarioTitle, !item.is_unlocked && styles.lockedText]}>
              {item.title}
            </Text>
            {!item.is_unlocked && <Text style={styles.lockIcon}>🔒</Text>}
          </View>
          <View style={styles.scenarioMeta}>
            <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(item.difficulty)}]}>
              <Text style={styles.difficultyText}>
                {item.difficulty === 'beginner' ? '初級' : 
                 item.difficulty === 'intermediate' ? '中級' : '上級'}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {item.duration_estimate}分
            </Text>
            {item.is_favorite && <Text style={styles.favoriteIcon}>⭐</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Text style={styles.favoriteButtonText}>
            {item.is_favorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.scenarioDescription, !item.is_unlocked && styles.lockedText]}>
        {item.description}
      </Text>
      
      {item.conversation_starters.length > 0 && (
        <Text style={[styles.scenarioStarter, !item.is_unlocked && styles.lockedText]}>
          "{ item.conversation_starters[0]}"
        </Text>
      )}

      <View style={styles.scenarioTags}>
        {item.suggested_topics.slice(0, 3).map((topic, index) => (
          <Text key={index} style={styles.scenarioTag}>
            #{topic}
          </Text>
        ))}
        {item.usage_count > 0 && (
          <Text style={styles.usageCount}>
            {item.usage_count}回使用
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecommendationItem = ({item}: {item: ScenarioRecommendation}) => (
    <TouchableOpacity
      style={styles.recommendationItem}
      onPress={() => handleScenarioSelect(item.scenario)}
    >
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationTitle}>{item.scenario.title}</Text>
        <View style={styles.compatibilityScore}>
          <Text style={styles.compatibilityText}>
            {Math.round(item.compatibility_score * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.recommendationReason}>{item.reason}</Text>
      <Text style={styles.recommendationDescription}>{item.scenario.description}</Text>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    items: Array<{key: string; label: string; icon?: string; color?: string}>,
    selectedValue: string,
    onSelect: (value: any) => void
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {items.map(item => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.filterButton,
            selectedValue === item.key && styles.filterButtonSelected,
          ]}
          onPress={() => onSelect(item.key)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedValue === item.key && styles.filterButtonTextSelected,
            ]}
          >
            {item.icon && `${item.icon} `}{item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
          <Text style={styles.headerTitle}>シナリオを選択</Text>
          <View style={styles.headerButtons}>
            {recommendations.length > 0 && (
              <TouchableOpacity
                style={styles.recommendationToggle}
                onPress={() => setShowRecommendations(!showRecommendations)}
              >
                <Text style={styles.recommendationToggleText}>
                  {showRecommendations ? '全て' : 'おすすめ'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.randomButton}
              onPress={handleRandomScenario}
            >
              <Text style={styles.randomButtonText}>🎲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!showRecommendations && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="シナリオを検索..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            <View style={styles.filtersSection}>
              <Text style={styles.filterLabel}>カテゴリ</Text>
              {renderFilterButton(categories, selectedCategory, setSelectedCategory)}
              
              <Text style={styles.filterLabel}>難易度</Text>
              {renderFilterButton(difficulties, selectedDifficulty, setSelectedDifficulty)}
            </View>
          </>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>シナリオを読み込み中...</Text>
          </View>
        ) : showRecommendations ? (
          <FlatList
            data={recommendations}
            renderItem={renderRecommendationItem}
            keyExtractor={item => item.scenario.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>あなたにおすすめのシナリオ</Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  おすすめシナリオが見つかりませんでした
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredScenarios}
            renderItem={renderScenarioItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  条件に合うシナリオが見つかりませんでした
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
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
  recommendationToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    marginRight: 8,
  },
  recommendationToggleText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  randomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  randomButtonText: {
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
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
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
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  scenarioItem: {
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
  lockedScenarioItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  selectedScenarioItem: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scenarioTitleContainer: {
    flex: 1,
  },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioCategory: {
    fontSize: 16,
    marginRight: 8,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  lockIcon: {
    fontSize: 14,
    marginLeft: 4,
  },
  scenarioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 12,
    color: '#999999',
    marginRight: 8,
  },
  favoriteIcon: {
    fontSize: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteButtonText: {
    fontSize: 16,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  scenarioStarter: {
    fontSize: 14,
    color: '#2196F3',
    fontStyle: 'italic',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  scenarioTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  scenarioTag: {
    fontSize: 12,
    color: '#999999',
    marginRight: 8,
    marginBottom: 4,
  },
  usageCount: {
    fontSize: 10,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  lockedText: {
    color: '#BBBBBB',
  },
  recommendationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    backgroundColor: '#F1F8E9',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  compatibilityScore: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compatibilityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recommendationReason: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
});

export default EnhancedScenarioSelector;