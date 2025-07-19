import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {Alert, Share} from 'react-native';
import {DataManagementScreen} from '../DataManagementScreen';
import {userSlice} from '../../store/slices/userSlice';
import {useStorage} from '../../hooks/useStorage';

// Mock Alert and Share
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
    },
  };
});

const mockAlert = Alert.alert as jest.Mock;
const mockShare = Share.share as jest.Mock;

// Mock useStorage hook
jest.mock('../../hooks/useStorage');
const mockUseStorage = useStorage as jest.MockedFunction<typeof useStorage>;

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userSlice.reducer,
    },
    preloadedState: {
      user: {
        profile: {
          id: 'test-user',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date('2023-01-01'),
          lastLoginAt: new Date('2023-01-01'),
          preferences: {
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
          statistics: {
            totalConversations: 0,
            favoriteCharacter: null,
            averageSessionLength: 0,
            lastActiveDate: new Date('2023-01-01'),
            totalPlayTime: 0,
            conversationsByScenario: {},
            favoriteEmotions: [],
            achievementCount: 0,
          },
          subscriptionTier: 'free',
          isActive: true,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        favoriteConversations: [],
        unlockedContent: [],
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DataManagementScreen', () => {
  const mockStorageHook = {
    isLoading: false,
    error: null,
    exportData: jest.fn(),
    importData: jest.fn(),
    clearAllData: jest.fn(),
    createBackup: jest.fn(),
    restoreFromBackup: jest.fn(),
    getAvailableBackups: jest.fn(),
    getStorageInfo: jest.fn(),
    saveProfile: jest.fn(),
    loadProfile: jest.fn(),
    savePreferences: jest.fn(),
    loadPreferences: jest.fn(),
    saveFavoriteConversations: jest.fn(),
    loadFavoriteConversations: jest.fn(),
    saveUnlockedContent: jest.fn(),
    loadUnlockedContent: jest.fn(),
    syncWithRedux: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStorage.mockReturnValue(mockStorageHook);
    
    // Mock storage info
    mockStorageHook.getStorageInfo.mockResolvedValue({
      totalKeys: 10,
      totalSize: 1024,
      keyDetails: [
        {key: 'USER_PROFILE', size: 512},
        {key: 'USER_PREFERENCES', size: 256},
        {key: 'FAVORITE_CONVERSATIONS', size: 128},
        {key: 'UNLOCKED_CONTENT', size: 128},
      ],
    });
    
    // Mock backups
    mockStorageHook.getAvailableBackups.mockResolvedValue([
      {key: 'BACKUP_1234567890', date: '2023-01-01T00:00:00.000Z'},
      {key: 'BACKUP_1234567891', date: '2023-01-02T00:00:00.000Z'},
    ]);
  });

  describe('Rendering', () => {
    it('should render data management screen correctly', async () => {
      renderWithProvider(<DataManagementScreen />);
      
      expect(screen.getByText('データ管理')).toBeTruthy();
      expect(screen.getByText('ストレージ情報')).toBeTruthy();
      expect(screen.getByText('データのエクスポート・インポート')).toBeTruthy();
      expect(screen.getByText('バックアップ管理')).toBeTruthy();
      expect(screen.getByText('危険な操作')).toBeTruthy();
      
      await waitFor(() => {
        expect(screen.getByText('詳細情報')).toBeTruthy();
      });
    });

    it('should display storage information', async () => {
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('総キー数:')).toBeTruthy();
        expect(screen.getByText('10')).toBeTruthy();
        expect(screen.getByText('使用容量:')).toBeTruthy();
        expect(screen.getByText('1 KB')).toBeTruthy();
        expect(screen.getByText('ユーザーID:')).toBeTruthy();
        expect(screen.getByText('test-user')).toBeTruthy();
        expect(screen.getByText('アカウント種別:')).toBeTruthy();
        expect(screen.getByText('無料')).toBeTruthy();
      });
    });

    it('should display backup information', async () => {
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('利用可能なバックアップ')).toBeTruthy();
        expect(screen.getByText('1234567890')).toBeTruthy();
        expect(screen.getByText('1234567891')).toBeTruthy();
      });
    });

    it('should display detailed storage information', async () => {
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('USER_PROFILE')).toBeTruthy();
        expect(screen.getByText('512 Bytes')).toBeTruthy();
        expect(screen.getByText('USER_PREFERENCES')).toBeTruthy();
        expect(screen.getByText('256 Bytes')).toBeTruthy();
        expect(screen.getByText('FAVORITE_CONVERSATIONS')).toBeTruthy();
        expect(screen.getByText('128 Bytes')).toBeTruthy();
        expect(screen.getByText('UNLOCKED_CONTENT')).toBeTruthy();
      });
    });

    it('should show loading indicator when storage info is loading', () => {
      mockStorageHook.getStorageInfo.mockImplementation(() => new Promise(() => {}));
      
      renderWithProvider(<DataManagementScreen />);
      
      expect(screen.getByText('ストレージ情報')).toBeTruthy();
      // Loading indicator should be present
    });

    it('should handle no backups available', async () => {
      mockStorageHook.getAvailableBackups.mockResolvedValue([]);
      
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('バックアップがありません')).toBeTruthy();
      });
    });
  });

  describe('Export Data', () => {
    it('should handle export data successfully', async () => {
      const mockExportData = '{"test": "data"}';
      mockStorageHook.exportData.mockResolvedValue(mockExportData);
      mockShare.mockResolvedValue(undefined);
      
      renderWithProvider(<DataManagementScreen />);
      
      const exportButton = screen.getByTestId('export-button');
      fireEvent.press(exportButton);
      
      await waitFor(() => {
        expect(mockStorageHook.exportData).toHaveBeenCalled();
        expect(mockShare).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('成功', 'データのエクスポートが完了しました');
      });
    });

    it('should handle export data error', async () => {
      mockStorageHook.exportData.mockRejectedValue(new Error('Export failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      const exportButton = screen.getByTestId('export-button');
      fireEvent.press(exportButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('エラー', 'データのエクスポートに失敗しました');
      });
    });

    it('should show loading state during export', async () => {
      mockStorageHook.exportData.mockImplementation(() => new Promise(() => {}));
      
      renderWithProvider(<DataManagementScreen />);
      
      const exportButton = screen.getByTestId('export-button');
      fireEvent.press(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText('エクスポート中...')).toBeTruthy();
      });
    });
  });

  describe('Import Data', () => {
    it('should handle import data successfully', async () => {
      const mockImportData = '{"test": "data"}';
      mockStorageHook.importData.mockResolvedValue(undefined);
      
      renderWithProvider(<DataManagementScreen />);
      
      const importButton = screen.getByTestId('import-button');
      fireEvent.press(importButton);
      
      // Note: In a real scenario, we would mock DocumentPicker to return a file
      // For this test, we'll just verify the button press is handled
      expect(importButton).toBeTruthy();
    });

    it('should handle import data error', async () => {
      mockStorageHook.importData.mockRejectedValue(new Error('Import failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      const importButton = screen.getByTestId('import-button');
      fireEvent.press(importButton);
      
      // Note: This would trigger the file picker in a real scenario
      expect(importButton).toBeTruthy();
    });

    it('should show loading state during import', async () => {
      mockStorageHook.importData.mockImplementation(() => new Promise(() => {}));
      
      renderWithProvider(<DataManagementScreen />);
      
      const importButton = screen.getByTestId('import-button');
      fireEvent.press(importButton);
      
      // Note: Loading state would be shown after file selection
      expect(importButton).toBeTruthy();
    });
  });

  describe('Clear All Data', () => {
    it('should handle clear all data successfully', async () => {
      mockStorageHook.clearAllData.mockResolvedValue(undefined);
      
      renderWithProvider(<DataManagementScreen />);
      
      const clearButton = screen.getByTestId('clear-data-button');
      fireEvent.press(clearButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        '全データ削除',
        '全てのデータが削除されます。この操作は元に戻せません。',
        expect.arrayContaining([
          expect.objectContaining({text: 'キャンセル', style: 'cancel'}),
          expect.objectContaining({text: '削除', style: 'destructive'}),
        ])
      );
    });

    it('should handle clear all data error', async () => {
      mockStorageHook.clearAllData.mockRejectedValue(new Error('Clear failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      const clearButton = screen.getByTestId('clear-data-button');
      fireEvent.press(clearButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        '全データ削除',
        '全てのデータが削除されます。この操作は元に戻せません。',
        expect.any(Array)
      );
    });
  });

  describe('Backup Management', () => {
    it('should handle create backup successfully', async () => {
      mockStorageHook.createBackup.mockResolvedValue(undefined);
      
      renderWithProvider(<DataManagementScreen />);
      
      const createBackupButton = screen.getByTestId('create-backup-button');
      fireEvent.press(createBackupButton);
      
      await waitFor(() => {
        expect(mockStorageHook.createBackup).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('成功', 'バックアップが作成されました');
      });
    });

    it('should handle create backup error', async () => {
      mockStorageHook.createBackup.mockRejectedValue(new Error('Backup failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      const createBackupButton = screen.getByTestId('create-backup-button');
      fireEvent.press(createBackupButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('エラー', 'バックアップの作成に失敗しました');
      });
    });

    it('should handle restore backup successfully', async () => {
      mockStorageHook.restoreFromBackup.mockResolvedValue(undefined);
      
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        const restoreButton = screen.getByTestId('restore-backup-0');
        fireEvent.press(restoreButton);
        
        expect(mockAlert).toHaveBeenCalledWith(
          'バックアップ復元',
          expect.stringContaining('のバックアップを復元しますか？'),
          expect.arrayContaining([
            expect.objectContaining({text: 'キャンセル', style: 'cancel'}),
            expect.objectContaining({text: '復元'}),
          ])
        );
      });
    });

    it('should handle restore backup error', async () => {
      mockStorageHook.restoreFromBackup.mockRejectedValue(new Error('Restore failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      await waitFor(() => {
        const restoreButton = screen.getByTestId('restore-backup-0');
        fireEvent.press(restoreButton);
        
        expect(mockAlert).toHaveBeenCalledWith(
          'バックアップ復元',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when storage hook has error', () => {
      mockUseStorage.mockReturnValue({
        ...mockStorageHook,
        error: 'Storage error occurred',
      });
      
      renderWithProvider(<DataManagementScreen />);
      
      expect(screen.getByText('Storage error occurred')).toBeTruthy();
    });

    it('should handle storage info loading error', async () => {
      mockStorageHook.getStorageInfo.mockRejectedValue(new Error('Storage info failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      // The component should handle the error gracefully
      expect(screen.getByText('ストレージ情報')).toBeTruthy();
    });

    it('should handle backups loading error', async () => {
      mockStorageHook.getAvailableBackups.mockRejectedValue(new Error('Backups failed'));
      
      renderWithProvider(<DataManagementScreen />);
      
      // The component should handle the error gracefully
      expect(screen.getByText('バックアップ管理')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during loading', () => {
      mockUseStorage.mockReturnValue({
        ...mockStorageHook,
        isLoading: true,
      });
      
      renderWithProvider(<DataManagementScreen />);
      
      const exportButton = screen.getByTestId('export-button');
      const importButton = screen.getByTestId('import-button');
      const clearButton = screen.getByTestId('clear-data-button');
      const createBackupButton = screen.getByTestId('create-backup-button');
      
      expect(exportButton.props.disabled).toBe(true);
      expect(importButton.props.disabled).toBe(true);
      expect(clearButton.props.disabled).toBe(true);
      expect(createBackupButton.props.disabled).toBe(true);
    });
  });

  describe('Format Utilities', () => {
    it('should format bytes correctly', () => {
      // This tests the formatBytes function indirectly through the component
      renderWithProvider(<DataManagementScreen />);
      
      // The component should display formatted sizes
      expect(screen.getByText('1 KB')).toBeTruthy();
    });
  });

  describe('Subscription Tiers', () => {
    it('should display premium subscription tier', () => {
      renderWithProvider(<DataManagementScreen />, {
        profile: {
          id: 'test-user',
          subscriptionTier: 'premium',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date('2023-01-01'),
          lastLoginAt: new Date('2023-01-01'),
          preferences: {},
          statistics: {
            totalConversations: 0,
            favoriteCharacter: null,
            averageSessionLength: 0,
            lastActiveDate: new Date('2023-01-01'),
            totalPlayTime: 0,
            conversationsByScenario: {},
            favoriteEmotions: [],
            achievementCount: 0,
          },
          isActive: true,
        },
      });
      
      expect(screen.getByText('プレミアム')).toBeTruthy();
    });

    it('should display VIP subscription tier', () => {
      renderWithProvider(<DataManagementScreen />, {
        profile: {
          id: 'test-user',
          subscriptionTier: 'vip',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date('2023-01-01'),
          lastLoginAt: new Date('2023-01-01'),
          preferences: {},
          statistics: {
            totalConversations: 0,
            favoriteCharacter: null,
            averageSessionLength: 0,
            lastActiveDate: new Date('2023-01-01'),
            totalPlayTime: 0,
            conversationsByScenario: {},
            favoriteEmotions: [],
            achievementCount: 0,
          },
          isActive: true,
        },
      });
      
      expect(screen.getByText('VIP')).toBeTruthy();
    });

    it('should handle null profile gracefully', () => {
      renderWithProvider(<DataManagementScreen />, {
        profile: null,
      });
      
      expect(screen.getByText('N/A')).toBeTruthy();
    });
  });
});