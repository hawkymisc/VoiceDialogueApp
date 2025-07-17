import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectActiveCharacterData,
  selectActiveCharacter,
  updateCharacterPersonality,
  updateCharacterAppearance,
  updateCharacterVoiceSettings,
  resetCharacterCustomization,
} from '../store/slices/characterSlice';
import {CharacterType} from '../types/Character';
import {CustomSlider} from './CustomSlider';

interface CharacterCustomizationProps {
  onClose?: () => void;
}

export const CharacterCustomization: React.FC<CharacterCustomizationProps> = ({
  onClose,
}) => {
  const dispatch = useDispatch();
  const activeCharacter = useSelector(selectActiveCharacter);
  const characterData = useSelector(selectActiveCharacterData);
  const [activeTab, setActiveTab] = useState<
    'personality' | 'appearance' | 'voice'
  >('personality');

  if (!activeCharacter || !characterData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>キャラクターが選択されていません</Text>
      </View>
    );
  }

  const handlePersonalityChange = (
    trait: keyof typeof characterData.personality,
    value: number,
  ) => {
    dispatch(
      updateCharacterPersonality({
        characterId: activeCharacter,
        personality: {[trait]: value},
      }),
    );
  };

  const handleVoiceChange = (
    setting: keyof typeof characterData.voiceSettings,
    value: number,
  ) => {
    dispatch(
      updateCharacterVoiceSettings({
        characterId: activeCharacter,
        voiceSettings: {[setting]: value},
      }),
    );
  };

  const handleReset = () => {
    Alert.alert(
      'カスタマイゼーションをリセット',
      '全ての設定を初期値に戻します。よろしいですか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => dispatch(resetCharacterCustomization(activeCharacter)),
        },
      ],
    );
  };

  const renderPersonalityTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>性格パラメータ</Text>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>積極性</Text>
        <Text style={styles.sliderDescription}>控えめ ← → 積極的</Text>
        <CustomSlider
          value={characterData.personality.aggressiveness}
          onValueChange={value =>
            handlePersonalityChange('aggressiveness', value)
          }
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.personality.aggressiveness}%
        </Text>
      </View>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>優しさ</Text>
        <Text style={styles.sliderDescription}>クール ← → 優しい</Text>
        <CustomSlider
          value={characterData.personality.kindness}
          onValueChange={value => handlePersonalityChange('kindness', value)}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.personality.kindness}%
        </Text>
      </View>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>ツンデレ度</Text>
        <Text style={styles.sliderDescription}>素直 ← → ツンデレ</Text>
        <CustomSlider
          value={characterData.personality.tsundereLevel}
          onValueChange={value =>
            handlePersonalityChange('tsundereLevel', value)
          }
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.personality.tsundereLevel}%
        </Text>
      </View>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>照れやすさ</Text>
        <Text style={styles.sliderDescription}>堂々 ← → 恥ずかしがり屋</Text>
        <CustomSlider
          value={characterData.personality.shyness}
          onValueChange={value => handlePersonalityChange('shyness', value)}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.personality.shyness}%
        </Text>
      </View>
    </View>
  );

  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>外見設定</Text>

      <View style={styles.appearanceSection}>
        <Text style={styles.sectionTitle}>髪色</Text>
        <View style={styles.colorPalette}>
          {HAIR_COLORS.map(color => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorOption,
                {backgroundColor: color.value},
                characterData.appearance.hairColor === color.value &&
                  styles.selectedColor,
              ]}
              onPress={() =>
                dispatch(
                  updateCharacterAppearance({
                    characterId: activeCharacter,
                    appearance: {hairColor: color.value},
                  }),
                )
              }>
              {characterData.appearance.hairColor === color.value && (
                <Text style={styles.selectedColorText}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.appearanceSection}>
        <Text style={styles.sectionTitle}>瞳の色</Text>
        <View style={styles.colorPalette}>
          {EYE_COLORS.map(color => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorOption,
                {backgroundColor: color.value},
                characterData.appearance.eyeColor === color.value &&
                  styles.selectedColor,
              ]}
              onPress={() =>
                dispatch(
                  updateCharacterAppearance({
                    characterId: activeCharacter,
                    appearance: {eyeColor: color.value},
                  }),
                )
              }>
              {characterData.appearance.eyeColor === color.value && (
                <Text style={styles.selectedColorText}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.appearanceSection}>
        <Text style={styles.sectionTitle}>服装カテゴリ</Text>
        <Text style={styles.currentClothing}>
          現在: {characterData.appearance.clothing.name} (
          {characterData.appearance.clothing.category})
        </Text>
        <Text style={styles.comingSoon}>
          服装変更機能は今後のアップデートで追加予定
        </Text>
      </View>
    </View>
  );

  const renderVoiceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>音声設定</Text>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>ピッチ</Text>
        <Text style={styles.sliderDescription}>低い ← → 高い</Text>
        <CustomSlider
          value={characterData.voiceSettings.pitch}
          onValueChange={value => handleVoiceChange('pitch', value)}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.voiceSettings.pitch}%
        </Text>
      </View>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>話す速度</Text>
        <Text style={styles.sliderDescription}>ゆっくり ← → 早口</Text>
        <CustomSlider
          value={characterData.voiceSettings.speed * 100}
          onValueChange={value => handleVoiceChange('speed', value / 100)}
          minimumValue={50}
          maximumValue={200}
          step={5}
        />
        <Text style={styles.sliderValue}>
          {characterData.voiceSettings.speed.toFixed(1)}x
        </Text>
      </View>

      <View style={styles.sliderGroup}>
        <Text style={styles.sliderLabel}>感情表現範囲</Text>
        <Text style={styles.sliderDescription}>控えめ ← → 豊か</Text>
        <CustomSlider
          value={characterData.voiceSettings.emotionalRange}
          onValueChange={value => handleVoiceChange('emotionalRange', value)}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>
          {characterData.voiceSettings.emotionalRange}%
        </Text>
      </View>

      <View style={styles.voiceInfo}>
        <Text style={styles.voiceInfoTitle}>使用音声モデル</Text>
        <Text style={styles.voiceInfoText}>
          {characterData.voiceSettings.voiceId}
        </Text>
        <Text style={styles.voiceInfoDescription}>
          Azure Cognitive Services Speech API
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {characterData.name} のカスタマイゼーション
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personality' && styles.activeTab]}
          onPress={() => setActiveTab('personality')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'personality' && styles.activeTabText,
            ]}>
            性格
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appearance' && styles.activeTab]}
          onPress={() => setActiveTab('appearance')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'appearance' && styles.activeTabText,
            ]}>
            外見
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'voice' && styles.activeTab]}
          onPress={() => setActiveTab('voice')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'voice' && styles.activeTabText,
            ]}>
            音声
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'personality' && renderPersonalityTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'voice' && renderVoiceTab()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>初期設定に戻す</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Color palettes for appearance customization
const HAIR_COLORS = [
  {name: '黒', value: '#2C1810'},
  {name: '茶色', value: '#8B4513'},
  {name: '青みがかった黒', value: '#4A90E2'},
  {name: '金色', value: '#FFD700'},
  {name: '銀', value: '#C0C0C0'},
  {name: '赤茶', value: '#A0522D'},
];

const EYE_COLORS = [
  {name: '茶色', value: '#4A3728'},
  {name: '青', value: '#2E5BBA'},
  {name: '緑', value: '#228B22'},
  {name: 'グレー', value: '#708090'},
  {name: 'ヘーゼル', value: '#8B7355'},
  {name: '紫', value: '#8A2BE2'},
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sliderGroup: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  appearanceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderColor: '#4A90E2',
    borderWidth: 3,
  },
  selectedColorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 1,
  },
  currentClothing: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  comingSoon: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  voiceInfo: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  voiceInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  voiceInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  voiceInfoDescription: {
    fontSize: 10,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default CharacterCustomization;
