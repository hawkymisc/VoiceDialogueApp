import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {DialogueScenario, DialogueCategory} from '../types/Dialogue';
import {
  SCENARIO_CATEGORIES,
  DEFAULT_SCENARIOS,
  getScenariosByCategory,
  getRandomScenario,
  searchScenarios,
} from '../data/scenarios';
import {setDialogueScenario} from '../store/slices/dialogueSlice';

interface ScenarioSelectorProps {
  onScenarioSelect: (scenario: DialogueScenario) => void;
  selectedScenario?: DialogueScenario;
  style?: any;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  onScenarioSelect,
  selectedScenario,
  style,
}) => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState<DialogueCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [modalScenario, setModalScenario] = useState<DialogueScenario | null>(null);

  const handleScenarioSelect = (scenario: DialogueScenario) => {
    dispatch(setDialogueScenario(scenario));
    onScenarioSelect(scenario);
  };

  const handleRandomScenario = () => {
    const randomScenario = getRandomScenario(selectedCategory === 'all' ? undefined : selectedCategory);
    handleScenarioSelect(randomScenario);
  };

  const handleScenarioDetails = (scenario: DialogueScenario) => {
    setModalScenario(scenario);
    setShowScenarioModal(true);
  };

  const getFilteredScenarios = () => {
    let scenarios: DialogueScenario[] = [];

    if (searchQuery) {
      scenarios = searchScenarios(searchQuery);
    } else if (selectedCategory === 'all') {
      scenarios = DEFAULT_SCENARIOS;
    } else {
      scenarios = getScenariosByCategory(selectedCategory);
    }

    return scenarios;
  };

  const filteredScenarios = getFilteredScenarios();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>シナリオ選択</Text>
        <TouchableOpacity
          style={styles.randomButton}
          onPress={handleRandomScenario}>
          <Text style={styles.randomButtonText}>🎲 ランダム</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="シナリオを検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory('all')}>
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === 'all' && styles.selectedCategoryButtonText,
            ]}>
            全て
          </Text>
        </TouchableOpacity>
        {Object.entries(SCENARIO_CATEGORIES).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryButton,
              selectedCategory === key && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(key as DialogueCategory)}>
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === key && styles.selectedCategoryButtonText,
              ]}>
              {category.icon} {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scenario List */}
      <ScrollView style={styles.scenarioList} showsVerticalScrollIndicator={false}>
        {filteredScenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={[
              styles.scenarioCard,
              selectedScenario?.id === scenario.id && styles.selectedScenarioCard,
            ]}
            onPress={() => handleScenarioSelect(scenario)}>
            <View style={styles.scenarioHeader}>
              <View style={styles.scenarioTitleContainer}>
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                <View style={styles.scenarioMeta}>
                  <Text
                    style={[
                      styles.scenarioCategory,
                      {backgroundColor: SCENARIO_CATEGORIES[scenario.category].color},
                    ]}>
                    {SCENARIO_CATEGORIES[scenario.category].icon} {SCENARIO_CATEGORIES[scenario.category].name}
                  </Text>
                  <Text style={styles.scenarioDifficulty}>
                    {scenario.difficulty === 'easy' ? '🟢' : scenario.difficulty === 'medium' ? '🟡' : '🔴'}
                    {scenario.difficulty === 'easy' ? '初級' : scenario.difficulty === 'medium' ? '中級' : '上級'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => handleScenarioDetails(scenario)}>
                <Text style={styles.infoButtonText}>ℹ️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.scenarioDescription}>{scenario.description}</Text>
            <Text style={styles.scenarioPrompt}>「{scenario.initialPrompt}」</Text>
            <View style={styles.scenarioTags}>
              {scenario.tags.slice(0, 3).map((tag, index) => (
                <Text key={index} style={styles.scenarioTag}>
                  #{tag}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredScenarios.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            {searchQuery ? '該当するシナリオが見つかりませんでした' : 'シナリオがありません'}
          </Text>
        </View>
      )}

      {/* Scenario Details Modal */}
      <Modal
        visible={showScenarioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScenarioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalScenario && (
              <>
                <Text style={styles.modalTitle}>{modalScenario.title}</Text>
                <View style={styles.modalMeta}>
                  <Text
                    style={[
                      styles.modalCategory,
                      {backgroundColor: SCENARIO_CATEGORIES[modalScenario.category].color},
                    ]}>
                    {SCENARIO_CATEGORIES[modalScenario.category].icon} {SCENARIO_CATEGORIES[modalScenario.category].name}
                  </Text>
                  <Text style={styles.modalDifficulty}>
                    難易度: {modalScenario.difficulty === 'easy' ? '初級' : modalScenario.difficulty === 'medium' ? '中級' : '上級'}
                  </Text>
                </View>
                <Text style={styles.modalDescription}>{modalScenario.description}</Text>
                <Text style={styles.modalPromptLabel}>開始メッセージ:</Text>
                <Text style={styles.modalPrompt}>「{modalScenario.initialPrompt}」</Text>
                
                {modalScenario.contextSettings && (
                  <View style={styles.modalContext}>
                    <Text style={styles.modalContextLabel}>シチュエーション:</Text>
                    {modalScenario.contextSettings.timeOfDay && (
                      <Text style={styles.modalContextItem}>
                        時間帯: {modalScenario.contextSettings.timeOfDay}
                      </Text>
                    )}
                    {modalScenario.contextSettings.location && (
                      <Text style={styles.modalContextItem}>
                        場所: {modalScenario.contextSettings.location}
                      </Text>
                    )}
                    {modalScenario.contextSettings.mood && (
                      <Text style={styles.modalContextItem}>
                        雰囲気: {modalScenario.contextSettings.mood}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.modalTags}>
                  {modalScenario.tags.map((tag, index) => (
                    <Text key={index} style={styles.modalTag}>
                      #{tag}
                    </Text>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      handleScenarioSelect(modalScenario);
                      setShowScenarioModal(false);
                    }}>
                    <Text style={styles.selectButtonText}>このシナリオを選択</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowScenarioModal(false)}>
                    <Text style={styles.closeButtonText}>閉じる</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  randomButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  randomButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  categoryScrollView: {
    backgroundColor: 'white',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#4A90E2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scenarioList: {
    flex: 1,
    padding: 16,
  },
  scenarioCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedScenarioCard: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f8ff',
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
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  scenarioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioCategory: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    fontWeight: 'bold',
  },
  scenarioDifficulty: {
    fontSize: 12,
    color: '#666',
  },
  infoButton: {
    padding: 4,
  },
  infoButtonText: {
    fontSize: 16,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  scenarioPrompt: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  scenarioTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scenarioTag: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
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
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCategory: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    fontWeight: 'bold',
  },
  modalDifficulty: {
    fontSize: 14,
    color: '#666',
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  modalPromptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalPrompt: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  modalContext: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalContextLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalContextItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  modalTag: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.5,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ScenarioSelector;