import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../store/store';
import {UserPreferences} from '../types/User';
import {updatePreferences} from '../store/slices/userSlice';
import {CustomSlider} from './CustomSlider';

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const [preferences, setPreferences] = useState<UserPreferences>(
    userProfile?.preferences || {
      favoriteScenarios: [],
      characterCustomizations: {
        aoi: {},
        shun: {},
      },
      audioSettings: {
        volume: 80,
        speed: 1.0,
        autoPlay: true,
        enableSoundEffects: true,
        preferredVoiceQuality: 'standard',
      },
      privacySettings: {
        shareConversations: false,
        allowDataCollection: false,
        showOnlineStatus: true,
        enableAnalytics: false,
        ageVerified: false,
      },
      relationshipSettings: {
        aoi: {
          relationshipType: '友達',
          intimacyLevel: 0,
          personalityTraits: {
            aggressiveness: 5,
            kindness: 8,
            tsundere: 3,
            shyness: 7,
          },
        },
        shun: {
          relationshipType: '先輩',
          intimacyLevel: 0,
          personalityTraits: {
            aggressiveness: 3,
            kindness: 9,
            tsundere: 2,
            shyness: 4,
          },
        },
      },
      language: 'ja',
      theme: 'light',
    },
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences(userProfile.preferences);
    }
  }, [userProfile]);

  const updatePreferenceValue = (
    section: keyof UserPreferences,
    key: string,
    value: any,
  ) => {
    const newPreferences = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    };
    setPreferences(newPreferences);
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      dispatch(updatePreferences(preferences));
      Alert.alert('設定保存', '設定が正常に保存されました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      '設定リセット',
      '全ての設定を初期値に戻しますか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            setPreferences({
              favoriteScenarios: [],
              characterCustomizations: {
                aoi: {},
                shun: {},
              },
              audioSettings: {
                volume: 80,
                speed: 1.0,
                autoPlay: true,
                enableSoundEffects: true,
                preferredVoiceQuality: 'standard',
              },
              privacySettings: {
                shareConversations: false,
                allowDataCollection: false,
                showOnlineStatus: true,
                enableAnalytics: false,
                ageVerified: false,
              },
              relationshipSettings: {
                aoi: {
                  relationshipType: '友達',
                  intimacyLevel: 0,
                  personalityTraits: {
                    aggressiveness: 5,
                    kindness: 8,
                    tsundere: 3,
                    shyness: 7,
                  },
                },
                shun: {
                  relationshipType: '先輩',
                  intimacyLevel: 0,
                  personalityTraits: {
                    aggressiveness: 3,
                    kindness: 9,
                    tsundere: 2,
                    shyness: 4,
                  },
                },
              },
              language: 'ja',
              theme: 'light',
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>設定</Text>

          {/* 音声設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>音声設定</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>音量</Text>
              <CustomSlider
                value={preferences.audioSettings.volume}
                minimumValue={0}
                maximumValue={100}
                step={1}
                onValueChange={(value) =>
                  updatePreferenceValue('audioSettings', 'volume', value)
                }
                style={styles.slider}
              />
              <Text style={styles.settingValue}>
                {preferences.audioSettings.volume}%
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>再生速度</Text>
              <CustomSlider
                value={preferences.audioSettings.speed}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                onValueChange={(value) =>
                  updatePreferenceValue('audioSettings', 'speed', value)
                }
                style={styles.slider}
              />
              <Text style={styles.settingValue}>
                {preferences.audioSettings.speed.toFixed(1)}x
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>自動再生</Text>
              <Switch
                value={preferences.audioSettings.autoPlay}
                onValueChange={(value) =>
                  updatePreferenceValue('audioSettings', 'autoPlay', value)
                }
                testID="autoplay-switch"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>効果音</Text>
              <Switch
                value={preferences.audioSettings.enableSoundEffects}
                onValueChange={(value) =>
                  updatePreferenceValue('audioSettings', 'enableSoundEffects', value)
                }
                testID="sound-effects-switch"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>音声品質</Text>
              <View style={styles.qualityButtons}>
                {(['standard', 'high', 'premium'] as const).map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      preferences.audioSettings.preferredVoiceQuality ===
                        quality && styles.qualityButtonSelected,
                    ]}
                    onPress={() =>
                      updatePreferenceValue(
                        'audioSettings',
                        'preferredVoiceQuality',
                        quality,
                      )
                    }
                    testID={`quality-${quality}`}
                  >
                    <Text
                      style={[
                        styles.qualityButtonText,
                        preferences.audioSettings.preferredVoiceQuality ===
                          quality && styles.qualityButtonTextSelected,
                      ]}
                    >
                      {quality === 'standard' ? '標準' : 
                       quality === 'high' ? '高品質' : 'プレミアム'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* プライバシー設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プライバシー設定</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>会話を共有</Text>
              <Switch
                value={preferences.privacySettings.shareConversations}
                onValueChange={(value) =>
                  updatePreferenceValue('privacySettings', 'shareConversations', value)
                }
                testID="share-conversations-switch"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>データ収集を許可</Text>
              <Switch
                value={preferences.privacySettings.allowDataCollection}
                onValueChange={(value) =>
                  updatePreferenceValue('privacySettings', 'allowDataCollection', value)
                }
                testID="data-collection-switch"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>オンライン状態を表示</Text>
              <Switch
                value={preferences.privacySettings.showOnlineStatus}
                onValueChange={(value) =>
                  updatePreferenceValue('privacySettings', 'showOnlineStatus', value)
                }
                testID="online-status-switch"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>分析を有効化</Text>
              <Switch
                value={preferences.privacySettings.enableAnalytics}
                onValueChange={(value) =>
                  updatePreferenceValue('privacySettings', 'enableAnalytics', value)
                }
                testID="analytics-switch"
              />
            </View>
          </View>

          {/* 表示設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>表示設定</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>言語</Text>
              <View style={styles.languageButtons}>
                {(['ja', 'en'] as const).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageButton,
                      preferences.language === lang && styles.languageButtonSelected,
                    ]}
                    onPress={() =>
                      updatePreferenceValue('language', '', lang)
                    }
                    testID={`language-${lang}`}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,
                        preferences.language === lang && styles.languageButtonTextSelected,
                      ]}
                    >
                      {lang === 'ja' ? '日本語' : 'English'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>テーマ</Text>
              <View style={styles.themeButtons}>
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeButton,
                      preferences.theme === theme && styles.themeButtonSelected,
                    ]}
                    onPress={() =>
                      updatePreferenceValue('theme', '', theme)
                    }
                    testID={`theme-${theme}`}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        preferences.theme === theme && styles.themeButtonTextSelected,
                      ]}
                    >
                      {theme === 'light' ? 'ライト' : 
                       theme === 'dark' ? 'ダーク' : '自動'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* キャラクター設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>キャラクター設定</Text>
            
            {(['aoi', 'shun'] as const).map((character) => (
              <View key={character} style={styles.characterSection}>
                <Text style={styles.characterTitle}>
                  {character === 'aoi' ? '蒼' : '瞬'}
                </Text>
                
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>積極性</Text>
                  <CustomSlider
                    value={preferences.relationshipSettings[character].personalityTraits.aggressiveness}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    onValueChange={(value) => {
                      const newRelationshipSettings = {
                        ...preferences.relationshipSettings,
                        [character]: {
                          ...preferences.relationshipSettings[character],
                          personalityTraits: {
                            ...preferences.relationshipSettings[character].personalityTraits,
                            aggressiveness: value,
                          },
                        },
                      };
                      setPreferences({
                        ...preferences,
                        relationshipSettings: newRelationshipSettings,
                      });
                    }}
                    style={styles.slider}
                  />
                  <Text style={styles.settingValue}>
                    {preferences.relationshipSettings[character].personalityTraits.aggressiveness}
                  </Text>
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>優しさ</Text>
                  <CustomSlider
                    value={preferences.relationshipSettings[character].personalityTraits.kindness}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    onValueChange={(value) => {
                      const newRelationshipSettings = {
                        ...preferences.relationshipSettings,
                        [character]: {
                          ...preferences.relationshipSettings[character],
                          personalityTraits: {
                            ...preferences.relationshipSettings[character].personalityTraits,
                            kindness: value,
                          },
                        },
                      };
                      setPreferences({
                        ...preferences,
                        relationshipSettings: newRelationshipSettings,
                      });
                    }}
                    style={styles.slider}
                  />
                  <Text style={styles.settingValue}>
                    {preferences.relationshipSettings[character].personalityTraits.kindness}
                  </Text>
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>ツンデレ度</Text>
                  <CustomSlider
                    value={preferences.relationshipSettings[character].personalityTraits.tsundere}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    onValueChange={(value) => {
                      const newRelationshipSettings = {
                        ...preferences.relationshipSettings,
                        [character]: {
                          ...preferences.relationshipSettings[character],
                          personalityTraits: {
                            ...preferences.relationshipSettings[character].personalityTraits,
                            tsundere: value,
                          },
                        },
                      };
                      setPreferences({
                        ...preferences,
                        relationshipSettings: newRelationshipSettings,
                      });
                    }}
                    style={styles.slider}
                  />
                  <Text style={styles.settingValue}>
                    {preferences.relationshipSettings[character].personalityTraits.tsundere}
                  </Text>
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>照れやすさ</Text>
                  <CustomSlider
                    value={preferences.relationshipSettings[character].personalityTraits.shyness}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    onValueChange={(value) => {
                      const newRelationshipSettings = {
                        ...preferences.relationshipSettings,
                        [character]: {
                          ...preferences.relationshipSettings[character],
                          personalityTraits: {
                            ...preferences.relationshipSettings[character].personalityTraits,
                            shyness: value,
                          },
                        },
                      };
                      setPreferences({
                        ...preferences,
                        relationshipSettings: newRelationshipSettings,
                      });
                    }}
                    style={styles.slider}
                  />
                  <Text style={styles.settingValue}>
                    {preferences.relationshipSettings[character].personalityTraits.shyness}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 操作ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveSettings}
              disabled={isLoading}
              testID="save-button"
            >
              <Text style={styles.buttonText}>
                {isLoading ? '保存中...' : '設定を保存'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetSettings}
              testID="reset-button"
            >
              <Text style={styles.buttonText}>設定をリセット</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    minWidth: 50,
    textAlign: 'right',
  },
  slider: {
    flex: 2,
    marginHorizontal: 16,
  },
  qualityButtons: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  qualityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginLeft: 8,
  },
  qualityButtonSelected: {
    backgroundColor: '#007AFF',
  },
  qualityButtonText: {
    fontSize: 12,
    color: '#666',
  },
  qualityButtonTextSelected: {
    color: '#fff',
  },
  languageButtons: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginLeft: 8,
  },
  languageButtonSelected: {
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    fontSize: 12,
    color: '#666',
  },
  languageButtonTextSelected: {
    color: '#fff',
  },
  themeButtons: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginLeft: 8,
  },
  themeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  themeButtonTextSelected: {
    color: '#fff',
  },
  characterSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  characterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});