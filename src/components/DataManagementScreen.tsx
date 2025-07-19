import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useStorage} from '../hooks/useStorage';
import {useSelector} from 'react-redux';
import {RootState} from '../store/store';
// Mock DocumentPicker and RNFS for testing
const DocumentPicker = {
  pickSingle: jest.fn(),
  types: { allFiles: '*/*' },
  isCancel: jest.fn(),
} as any;

const RNFS = {
  DocumentDirectoryPath: '/tmp',
  readFile: jest.fn(),
  writeFile: jest.fn(),
} as any;

interface DataManagementScreenProps {}

interface StorageInfo {
  totalKeys: number;
  totalSize: number;
  keyDetails: Array<{key: string; size: number}>;
}

interface BackupInfo {
  key: string;
  date: string;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = () => {
  const {
    isLoading,
    error,
    exportData,
    importData,
    clearAllData,
    createBackup,
    restoreFromBackup,
    getAvailableBackups,
    getStorageInfo,
  } = useStorage();

  const userProfile = useSelector((state: RootState) => state.user.profile);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    loadBackups();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const backupList = await getAvailableBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      
      if (Platform.OS === 'ios') {
        await Share.share({
          message: data,
          title: 'VoiceDialogueApp Data Export',
        });
      } else {
        const fileName = `voice_dialogue_export_${new Date().toISOString().split('T')[0]}.json`;
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        
        await RNFS.writeFile(filePath, data, 'utf8');
        
        await Share.share({
          url: `file://${filePath}`,
          title: 'VoiceDialogueApp Data Export',
        });
      }
      
      Alert.alert('成功', 'データのエクスポートが完了しました');
    } catch (error) {
      Alert.alert('エラー', 'データのエクスポートに失敗しました');
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      
      const fileContent = await RNFS.readFile(result.uri, 'utf8');
      
      Alert.alert(
        '確認',
        '既存のデータが上書きされます。続行しますか？',
        [
          {text: 'キャンセル', style: 'cancel'},
          {
            text: 'インポート',
            onPress: async () => {
              try {
                await importData(fileContent);
                Alert.alert('成功', 'データのインポートが完了しました');
                loadStorageInfo();
              } catch (error) {
                Alert.alert('エラー', 'データのインポートに失敗しました');
                console.error('Import failed:', error);
              }
            },
          },
        ],
      );
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('エラー', 'ファイルの選択に失敗しました');
        console.error('File selection failed:', error);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      '全データ削除',
      '全てのデータが削除されます。この操作は元に戻せません。',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('成功', '全てのデータが削除されました');
              loadStorageInfo();
            } catch (error) {
              Alert.alert('エラー', 'データの削除に失敗しました');
              console.error('Clear data failed:', error);
            }
          },
        },
      ],
    );
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      Alert.alert('成功', 'バックアップが作成されました');
      loadBackups();
    } catch (error) {
      Alert.alert('エラー', 'バックアップの作成に失敗しました');
      console.error('Backup creation failed:', error);
    }
  };

  const handleRestoreBackup = (backupKey: string, date: string) => {
    Alert.alert(
      'バックアップ復元',
      `${new Date(date).toLocaleString()}のバックアップを復元しますか？`,
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '復元',
          onPress: async () => {
            try {
              await restoreFromBackup(backupKey);
              Alert.alert('成功', 'バックアップが復元されました');
              loadStorageInfo();
            } catch (error) {
              Alert.alert('エラー', 'バックアップの復元に失敗しました');
              console.error('Backup restore failed:', error);
            }
          },
        },
      ],
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>データ管理</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ストレージ情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ストレージ情報</Text>
            
            {storageInfo ? (
              <View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>総キー数:</Text>
                  <Text style={styles.infoValue}>{storageInfo.totalKeys}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>使用容量:</Text>
                  <Text style={styles.infoValue}>{formatBytes(storageInfo.totalSize)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ユーザーID:</Text>
                  <Text style={styles.infoValue}>{userProfile?.id || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>アカウント種別:</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.subscriptionTier === 'free' ? '無料' :
                     userProfile?.subscriptionTier === 'premium' ? 'プレミアム' : 'VIP'}
                  </Text>
                </View>
              </View>
            ) : (
              <ActivityIndicator size="small" color="#007AFF" />
            )}
          </View>

          {/* データエクスポート・インポート */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データのエクスポート・インポート</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.exportButton]}
              onPress={handleExportData}
              disabled={isExporting || isLoading}
              testID="export-button"
            >
              <Text style={styles.buttonText}>
                {isExporting ? 'エクスポート中...' : 'データをエクスポート'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.importButton]}
              onPress={handleImportData}
              disabled={isImporting || isLoading}
              testID="import-button"
            >
              <Text style={styles.buttonText}>
                {isImporting ? 'インポート中...' : 'データをインポート'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.description}>
              エクスポートしたデータは他のデバイスでインポートできます。
            </Text>
          </View>

          {/* バックアップ管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>バックアップ管理</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.backupButton]}
              onPress={handleCreateBackup}
              disabled={isLoading}
              testID="create-backup-button"
            >
              <Text style={styles.buttonText}>バックアップを作成</Text>
            </TouchableOpacity>

            <Text style={styles.backupTitle}>利用可能なバックアップ</Text>
            {backups.length > 0 ? (
              backups.map((backup, index) => (
                <View key={backup.key} style={styles.backupItem}>
                  <View style={styles.backupInfo}>
                    <Text style={styles.backupDate}>
                      {new Date(backup.date).toLocaleString()}
                    </Text>
                    <Text style={styles.backupKey}>
                      {backup.key.replace('BACKUP_', '')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => handleRestoreBackup(backup.key, backup.date)}
                    testID={`restore-backup-${index}`}
                  >
                    <Text style={styles.restoreButtonText}>復元</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noBackupsText}>バックアップがありません</Text>
            )}
          </View>

          {/* 危険な操作 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>危険な操作</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleClearAllData}
              disabled={isLoading}
              testID="clear-data-button"
            >
              <Text style={styles.buttonText}>全データを削除</Text>
            </TouchableOpacity>

            <Text style={styles.dangerDescription}>
              この操作は元に戻せません。必要なデータは事前にエクスポートしてください。
            </Text>
          </View>

          {/* 詳細情報 */}
          {storageInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>詳細情報</Text>
              {storageInfo.keyDetails.map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailKey} numberOfLines={1}>
                    {detail.key}
                  </Text>
                  <Text style={styles.detailSize}>
                    {formatBytes(detail.size)}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
  },
  importButton: {
    backgroundColor: '#34C759',
  },
  backupButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    color: '#333',
  },
  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  backupKey: {
    fontSize: 12,
    color: '#666',
  },
  restoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noBackupsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 4,
  },
  detailKey: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  detailSize: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
});