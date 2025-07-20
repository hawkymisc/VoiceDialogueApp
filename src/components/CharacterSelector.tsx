import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  selectCharacters,
  selectActiveCharacter,
  selectRelationshipSettings,
  switchCharacter,
  setRelationshipType,
} from '../store/slices/characterSlice';
import {CharacterType, RelationshipType} from '../types/Character';
import {RELATIONSHIP_TYPES} from '../data/characters';

interface CharacterSelectorProps {
  onCharacterSelect?: (characterId: CharacterType) => void;
  showRelationshipSettings?: boolean;
  showStartButton?: boolean;
}

type NavigationProp = StackNavigationProp<{
  Dialogue: {characterId: CharacterType; userId: string};
}>;

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  onCharacterSelect,
  showRelationshipSettings = true,
  showStartButton = false,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const characters = useSelector(selectCharacters);
  const activeCharacter = useSelector(selectActiveCharacter);
  const relationshipSettings = useSelector(selectRelationshipSettings);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);

  const handleCharacterSelect = (characterId: CharacterType) => {
    dispatch(switchCharacter(characterId));
    onCharacterSelect?.(characterId);
  };

  const handleRelationshipChange = (type: RelationshipType) => {
    dispatch(setRelationshipType(type));
    setShowRelationshipModal(false);
  };

  const handleStartDialogue = () => {
    if (activeCharacter) {
      // Generate a simple user ID for demo purposes
      const userId = `user_${Date.now()}`;
      
      navigation.navigate('Dialogue', {
        characterId: activeCharacter,
        userId: userId,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>キャラクター選択</Text>

      {/* Relationship Settings */}
      {showRelationshipSettings && (
        <View style={styles.relationshipSection}>
          <Text style={styles.sectionTitle}>関係性設定</Text>
          <TouchableOpacity
            style={styles.relationshipButton}
            onPress={() => setShowRelationshipModal(true)}>
            <Text style={styles.relationshipButtonText}>
              {RELATIONSHIP_TYPES[relationshipSettings.type].name}
            </Text>
            <Text style={styles.relationshipButtonSubtext}>
              {RELATIONSHIP_TYPES[relationshipSettings.type].description}
            </Text>
          </TouchableOpacity>
          <View style={styles.relationshipStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                親密度: {relationshipSettings.intimacyLevel}%
              </Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statFill,
                    {width: `${relationshipSettings.intimacyLevel}%`},
                  ]}
                />
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                信頼度: {relationshipSettings.trustLevel}%
              </Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statFill,
                    {width: `${relationshipSettings.trustLevel}%`},
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.characterList}>
        {Object.entries(characters).map(([id, character]) => {
          const characterId = id as CharacterType;
          const isActive = activeCharacter === characterId;

          return (
            <TouchableOpacity
              key={characterId}
              style={[
                styles.characterCard,
                isActive && styles.activeCharacterCard,
              ]}
              onPress={() => handleCharacterSelect(characterId)}>
              <View style={styles.characterInfo}>
                <Text
                  style={[
                    styles.characterName,
                    isActive && styles.activeCharacterName,
                  ]}>
                  {character.name}
                </Text>
                <Text style={styles.characterAge}>{character.age}歳</Text>
                <Text style={styles.characterDescription}>
                  {character.description}
                </Text>
              </View>

              {/* Character personality indicators */}
              <View style={styles.personalityIndicators}>
                <View style={styles.personalityItem}>
                  <Text style={styles.personalityLabel}>優しさ</Text>
                  <View style={styles.personalityBar}>
                    <View
                      style={[
                        styles.personalityFill,
                        {width: `${character.personality.kindness}%`},
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.personalityItem}>
                  <Text style={styles.personalityLabel}>積極性</Text>
                  <View style={styles.personalityBar}>
                    <View
                      style={[
                        styles.personalityFill,
                        {width: `${character.personality.aggressiveness}%`},
                      ]}
                    />
                  </View>
                </View>
              </View>

              {isActive && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>選択中</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Start Dialogue Button */}
      {showStartButton && activeCharacter && (
        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartDialogue}>
            <Text style={styles.startButtonText}>
              {characters[activeCharacter]?.name}と対話を始める
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Relationship Selection Modal */}
      <Modal
        visible={showRelationshipModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRelationshipModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>関係性を選択</Text>
            <ScrollView style={styles.relationshipList}>
              {(Object.keys(RELATIONSHIP_TYPES) as RelationshipType[]).map(
                type => {
                  const relationshipType = RELATIONSHIP_TYPES[type];
                  const isSelected = relationshipSettings.type === type;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.relationshipOption,
                        isSelected && styles.selectedRelationshipOption,
                      ]}
                      onPress={() => handleRelationshipChange(type)}>
                      <Text
                        style={[
                          styles.relationshipOptionTitle,
                          isSelected && styles.selectedRelationshipOptionText,
                        ]}>
                        {relationshipType.name}
                      </Text>
                      <Text
                        style={[
                          styles.relationshipOptionDescription,
                          isSelected && styles.selectedRelationshipOptionText,
                        ]}>
                        {relationshipType.description}
                      </Text>
                      <View style={styles.relationshipOptionStats}>
                        <Text style={styles.relationshipOptionStat}>
                          親密度: {relationshipType.defaultIntimacy}%
                        </Text>
                        <Text style={styles.relationshipOptionStat}>
                          信頼度: {relationshipType.defaultTrust}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRelationshipModal(false)}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  characterList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  characterCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCharacterCard: {
    borderColor: '#4A90E2',
    backgroundColor: '#e3f2fd',
  },
  characterInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activeCharacterName: {
    color: '#4A90E2',
  },
  characterAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  characterDescription: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 16,
  },
  personalityIndicators: {
    marginBottom: 12,
  },
  personalityItem: {
    marginBottom: 8,
  },
  personalityLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  personalityBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  personalityFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  activeIndicator: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  activeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Relationship settings styles
  relationshipSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  relationshipButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  relationshipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  relationshipButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  relationshipStats: {
    gap: 8,
  },
  statItem: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    backgroundColor: '#66bb6a',
    borderRadius: 3,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  relationshipList: {
    maxHeight: 400,
  },
  relationshipOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRelationshipOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4A90E2',
  },
  relationshipOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  relationshipOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  selectedRelationshipOptionText: {
    color: '#4A90E2',
  },
  relationshipOptionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  relationshipOptionStat: {
    fontSize: 11,
    color: '#777',
  },
  modalCloseButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Start button styles
  startButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CharacterSelector;
