import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {contentFilterService} from '../services/contentFilterService';
import {securityService} from '../services/securityService';
import {
  ContentRating,
  UserContentPreferences,
  ContentFilter,
  AuditLog,
} from '../types/ContentSecurity';

interface SecuritySettingsScreenProps {
  userId: string;
  onClose: () => void;
  visible: boolean;
}

const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({
  userId,
  onClose,
  visible,
}) => {
  const [userPreferences, setUserPreferences] = useState<UserContentPreferences | null>(null);
  const [availableFilters, setAvailableFilters] = useState<ContentFilter[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showParentalControls, setShowParentalControls] = useState(false);
  const [parentalPin, setParentalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [loading, setLoading] = useState(true);

  const contentRatings: Array<{rating: ContentRating; label: string; description: string}> = [
    {
      rating: 'general',
      label: '全年齢対象',
      description: '全年齢が利用できる健全なコンテンツ',
    },
    {
      rating: 'teen',
      label: '13歳以上',
      description: '中学生以上向けのコンテンツ',
    },
    {
      rating: 'mature',
      label: '17歳以上',
      description: '高校生以上向けのコンテンツ',
    },
    {
      rating: 'restricted',
      label: '18歳以上',
      description: '大学生・社会人向けのコンテンツ',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible, userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // セキュリティサービスを初期化
      await securityService.initialize();
      
      // ユーザー設定を初期化・読み込み
      await contentFilterService.initializeUserPreferences(userId);
      const preferences = await contentFilterService.getUserContentPreferences(userId);
      setUserPreferences(preferences);

      // 利用可能なフィルターを読み込み
      const filters = await contentFilterService.getAvailableFilters();
      setAvailableFilters(filters);

      // 監査ログを読み込み
      const logs = await securityService.getAuditLogs(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 過去7日
        undefined,
        userId
      );
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load security settings:', error);
      Alert.alert('エラー', 'セキュリティ設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleContentRatingChange = async (rating: ContentRating) => {
    if (!userPreferences) return;

    try {
      await contentFilterService.updateUserContentPreferences(userId, {
        contentRating: rating,
      });
      
      setUserPreferences({...userPreferences, contentRating: rating});
      Alert.alert('更新完了', 'コンテンツレーティングが更新されました');
    } catch (error) {
      console.error('Failed to update content rating:', error);
      Alert.alert('エラー', 'コンテンツレーティングの更新に失敗しました');
    }
  };

  const handleFilterToggle = async (filterId: string, enabled: boolean) => {
    if (!userPreferences) return;

    try {
      const enabledFilters = enabled
        ? [...userPreferences.enabledFilters, filterId]
        : userPreferences.enabledFilters.filter(id => id !== filterId);

      await contentFilterService.updateUserContentPreferences(userId, {
        enabledFilters,
      });

      setUserPreferences({...userPreferences, enabledFilters});
    } catch (error) {
      console.error('Failed to toggle filter:', error);
      Alert.alert('エラー', 'フィルター設定の更新に失敗しました');
    }
  };

  const handlePrivacySettingChange = async (setting: keyof UserContentPreferences['privacySettings'], value: boolean) => {
    if (!userPreferences) return;

    try {
      await contentFilterService.updateUserContentPreferences(userId, {
        privacySettings: {
          ...userPreferences.privacySettings,
          [setting]: value,
        },
      });

      setUserPreferences({
        ...userPreferences,
        privacySettings: {
          ...userPreferences.privacySettings,
          [setting]: value,
        },
      });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      Alert.alert('エラー', 'プライバシー設定の更新に失敗しました');
    }
  };

  const handleParentalControlsToggle = async (enabled: boolean) => {
    if (!userPreferences) return;

    if (enabled && !userPreferences.parentalControls.pin) {
      setIsSettingPin(true);
      return;
    }

    if (!enabled) {
      // PINの確認
      Alert.prompt(
        'ペアレンタルコントロール解除',
        'PINを入力してください',
        [
          {text: 'キャンセル', style: 'cancel'},
          {
            text: 'OK',
            onPress: async (pin) => {
              if (pin === userPreferences.parentalControls.pin) {
                await updateParentalControls({isEnabled: false});
              } else {
                Alert.alert('エラー', 'PINが正しくありません');
              }
            },
          },
        ],
        'secure-text'
      );
      return;
    }

    await updateParentalControls({isEnabled: enabled});
  };

  const updateParentalControls = async (updates: Partial<UserContentPreferences['parentalControls']>) => {
    if (!userPreferences) return;

    try {
      await contentFilterService.updateUserContentPreferences(userId, {
        parentalControls: {
          ...userPreferences.parentalControls,
          ...updates,
        },
      });

      setUserPreferences({
        ...userPreferences,
        parentalControls: {
          ...userPreferences.parentalControls,
          ...updates,
        },
      });
    } catch (error) {
      console.error('Failed to update parental controls:', error);
      Alert.alert('エラー', 'ペアレンタルコントロール設定の更新に失敗しました');
    }
  };

  const handleSetParentalPin = async () => {
    if (parentalPin !== confirmPin) {
      Alert.alert('エラー', 'PINが一致しません');
      return;
    }

    if (parentalPin.length < 4) {
      Alert.alert('エラー', 'PINは4桁以上で設定してください');
      return;
    }

    await updateParentalControls({
      isEnabled: true,
      pin: parentalPin,
    });

    setIsSettingPin(false);
    setParentalPin('');
    setConfirmPin('');
    Alert.alert('設定完了', 'ペアレンタルコントロールが有効になりました');
  };

  const handleExportData = async () => {
    try {
      const exportData = await securityService.requestDataExport(userId, 'json');
      
      // 実際のアプリでは適切な共有機能を使用
      Alert.alert(
        'データエクスポート',
        'データのエクスポートが完了しました。ファイルサイズ: ' + 
        Math.round(exportData.length / 1024) + 'KB'
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('エラー', 'データのエクスポートに失敗しました');
    }
  };

  const handleDeleteAllData = async () => {
    Alert.alert(
      'データ削除確認',
      'すべてのデータを削除しますか？この操作は取り消せません。',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await securityService.requestDataDeletion(userId, 'complete');
              Alert.alert('削除完了', 'すべてのデータが削除されました');
              onClose();
            } catch (error) {
              console.error('Failed to delete data:', error);
              Alert.alert('エラー', 'データの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const getFilterSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
  };

  if (!visible) return null;

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>設定を読み込み中...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>セキュリティ設定</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* コンテンツレーティング */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>コンテンツレーティング</Text>
            <Text style={styles.sectionDescription}>
              表示されるコンテンツの年齢制限を設定します
            </Text>
            
            {contentRatings.map(({rating, label, description}) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  userPreferences?.contentRating === rating && styles.selectedRatingOption,
                ]}
                onPress={() => handleContentRatingChange(rating)}
              >
                <View style={styles.ratingInfo}>
                  <Text style={styles.ratingLabel}>{label}</Text>
                  <Text style={styles.ratingDescription}>{description}</Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    userPreferences?.contentRating === rating && styles.selectedRadioButton,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* コンテンツフィルター */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>コンテンツフィルター</Text>
            <Text style={styles.sectionDescription}>
              不適切なコンテンツを自動的にフィルタリングします
            </Text>

            {availableFilters.map(filter => (
              <View key={filter.id} style={styles.filterItem}>
                <View style={styles.filterInfo}>
                  <Text style={styles.filterName}>{filter.name}</Text>
                  <Text style={styles.filterDescription}>{filter.description}</Text>
                  <View style={styles.filterMeta}>
                    <View
                      style={[
                        styles.severityBadge,
                        {backgroundColor: getFilterSeverityColor(filter.severity)},
                      ]}
                    >
                      <Text style={styles.severityText}>{filter.severity}</Text>
                    </View>
                    <Text style={styles.filterAction}>動作: {filter.action}</Text>
                  </View>
                </View>
                <Switch
                  value={userPreferences?.enabledFilters.includes(filter.id) || false}
                  onValueChange={(value) => handleFilterToggle(filter.id, value)}
                />
              </View>
            ))}
          </View>

          {/* ペアレンタルコントロール */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ペアレンタルコントロール</Text>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setShowParentalControls(!showParentalControls)}
              >
                <Text style={styles.expandButtonText}>
                  {showParentalControls ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>

            {showParentalControls && (
              <View style={styles.expandedSection}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>ペアレンタルコントロールを有効にする</Text>
                  <Switch
                    value={userPreferences?.parentalControls.isEnabled || false}
                    onValueChange={handleParentalControlsToggle}
                  />
                </View>

                {userPreferences?.parentalControls.isEnabled && (
                  <Text style={styles.infoText}>
                    ペアレンタルコントロールが有効です。設定を変更するにはPINが必要です。
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* プライバシー設定 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>プライバシー設定</Text>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setShowPrivacySettings(!showPrivacySettings)}
              >
                <Text style={styles.expandButtonText}>
                  {showPrivacySettings ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPrivacySettings && (
              <View style={styles.expandedSection}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>データ収集を許可する</Text>
                  <Switch
                    value={userPreferences?.privacySettings.dataCollection || false}
                    onValueChange={(value) => handlePrivacySettingChange('dataCollection', value)}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>分析データを許可する</Text>
                  <Switch
                    value={userPreferences?.privacySettings.analytics || false}
                    onValueChange={(value) => handlePrivacySettingChange('analytics', value)}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>パーソナライゼーションを許可する</Text>
                  <Switch
                    value={userPreferences?.privacySettings.personalization || false}
                    onValueChange={(value) => handlePrivacySettingChange('personalization', value)}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>使用データの共有を許可する</Text>
                  <Switch
                    value={userPreferences?.privacySettings.shareUsageData || false}
                    onValueChange={(value) => handlePrivacySettingChange('shareUsageData', value)}
                  />
                </View>
              </View>
            )}
          </View>

          {/* データ管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ管理</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
              <Text style={styles.actionButtonText}>📤 データをエクスポート</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.auditButton}
              onPress={() => setShowAuditLogs(true)}
            >
              <Text style={styles.actionButtonText}>📊 監査ログを表示</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDeleteAllData}
            >
              <Text style={styles.dangerButtonText}>🗑️ すべてのデータを削除</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* PIN設定モーダル */}
        <Modal visible={isSettingPin} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ペアレンタルコントロールPIN設定</Text>
              
              <TextInput
                style={styles.pinInput}
                placeholder="PIN（4桁以上）"
                secureTextEntry
                value={parentalPin}
                onChangeText={setParentalPin}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.pinInput}
                placeholder="PIN確認"
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsSettingPin(false)}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSetParentalPin}
                >
                  <Text style={styles.confirmButtonText}>設定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 監査ログモーダル */}
        <Modal visible={showAuditLogs} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.auditContainer}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditTitle}>監査ログ</Text>
              <TouchableOpacity
                onPress={() => setShowAuditLogs(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.auditList}>
              {auditLogs.map(log => (
                <View key={log.id} style={styles.auditLogItem}>
                  <View style={styles.auditLogHeader}>
                    <Text style={styles.auditLogAction}>{log.action}</Text>
                    <Text style={styles.auditLogTime}>{formatDate(log.timestamp)}</Text>
                  </View>
                  <Text style={styles.auditLogResource}>リソース: {log.resource}</Text>
                  <View style={styles.auditLogFooter}>
                    <Text
                      style={[
                        styles.auditLogResult,
                        {color: log.result === 'success' ? '#4CAF50' : '#F44336'},
                      ]}
                    >
                      {log.result}
                    </Text>
                    <Text style={styles.auditLogRisk}>リスク: {log.riskLevel}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  expandButton: {
    padding: 4,
  },
  expandButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  expandedSection: {
    marginTop: 8,
  },
  ratingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedRatingOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  ratingInfo: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  ratingDescription: {
    fontSize: 12,
    color: '#666666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedRadioButton: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterInfo: {
    flex: 1,
    marginRight: 16,
  },
  filterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  filterDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  filterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterAction: {
    fontSize: 10,
    color: '#999999',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  actionButton: {
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  auditButton: {
    backgroundColor: '#F3E5F5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  dangerButtonText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  auditContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  auditTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  auditList: {
    flex: 1,
    padding: 16,
  },
  auditLogItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  auditLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  auditLogAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  auditLogTime: {
    fontSize: 12,
    color: '#666666',
  },
  auditLogResource: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  auditLogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditLogResult: {
    fontSize: 12,
    fontWeight: '600',
  },
  auditLogRisk: {
    fontSize: 12,
    color: '#999999',
  },
});

export default SecuritySettingsScreen;