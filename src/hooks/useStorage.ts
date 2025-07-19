import {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../store/store';
import {storageService} from '../services/storageService';
import {UserProfile, UserPreferences} from '../types/User';
import {
  updatePreferences,
  addFavoriteConversation,
  removeFavoriteConversation,
  unlockContent,
  updateStatistics,
} from '../store/slices/userSlice';

export interface UseStorageReturn {
  isLoading: boolean;
  error: string | null;
  saveProfile: (profile: UserProfile) => Promise<void>;
  loadProfile: () => Promise<UserProfile | null>;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  loadPreferences: () => Promise<UserPreferences | null>;
  saveFavoriteConversations: (conversationIds: string[]) => Promise<void>;
  loadFavoriteConversations: () => Promise<string[]>;
  saveUnlockedContent: (contentIds: string[]) => Promise<void>;
  loadUnlockedContent: () => Promise<string[]>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  createBackup: () => Promise<void>;
  restoreFromBackup: (backupKey: string) => Promise<void>;
  getAvailableBackups: () => Promise<Array<{key: string; date: string}>>;
  getStorageInfo: () => Promise<{
    totalKeys: number;
    totalSize: number;
    keyDetails: Array<{key: string; size: number}>;
  }>;
  syncWithRedux: () => Promise<void>;
}

export const useStorage = (): UseStorageReturn => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const favoriteConversations = useSelector((state: RootState) => state.user.favoriteConversations);
  const unlockedContent = useSelector((state: RootState) => state.user.unlockedContent);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error);
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveProfile = useCallback(async (profile: UserProfile) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.saveUserProfile(profile);
    } catch (error) {
      handleError(error, 'プロファイルの保存に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    setIsLoading(true);
    clearError();
    try {
      const profile = await storageService.getUserProfile();
      return profile;
    } catch (error) {
      handleError(error, 'プロファイルの読み込みに失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const savePreferences = useCallback(async (preferences: UserPreferences) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.saveUserPreferences(preferences);
      dispatch(updatePreferences(preferences));
    } catch (error) {
      handleError(error, '設定の保存に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, handleError, clearError]);

  const loadPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    setIsLoading(true);
    clearError();
    try {
      const preferences = await storageService.getUserPreferences();
      if (preferences) {
        dispatch(updatePreferences(preferences));
      }
      return preferences;
    } catch (error) {
      handleError(error, '設定の読み込みに失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, handleError, clearError]);

  const saveFavoriteConversations = useCallback(async (conversationIds: string[]) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.saveFavoriteConversations(conversationIds);
    } catch (error) {
      handleError(error, 'お気に入り会話の保存に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const loadFavoriteConversations = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    clearError();
    try {
      const conversations = await storageService.getFavoriteConversations();
      return conversations;
    } catch (error) {
      handleError(error, 'お気に入り会話の読み込みに失敗しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const saveUnlockedContent = useCallback(async (contentIds: string[]) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.saveUnlockedContent(contentIds);
    } catch (error) {
      handleError(error, 'アンロックコンテンツの保存に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const loadUnlockedContent = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    clearError();
    try {
      const content = await storageService.getUnlockedContent();
      return content;
    } catch (error) {
      handleError(error, 'アンロックコンテンツの読み込みに失敗しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const exportData = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    clearError();
    try {
      const data = await storageService.exportData();
      return data;
    } catch (error) {
      handleError(error, 'データのエクスポートに失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const importData = useCallback(async (data: string) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.importData(data);
      await syncWithRedux();
    } catch (error) {
      handleError(error, 'データのインポートに失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const clearAllData = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.clearAllData();
    } catch (error) {
      handleError(error, 'データの削除に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const createBackup = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.createBackup();
    } catch (error) {
      handleError(error, 'バックアップの作成に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const restoreFromBackup = useCallback(async (backupKey: string) => {
    setIsLoading(true);
    clearError();
    try {
      await storageService.restoreFromBackup(backupKey);
      await syncWithRedux();
    } catch (error) {
      handleError(error, 'バックアップからの復元に失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const getAvailableBackups = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const backups = await storageService.getAvailableBackups();
      return backups;
    } catch (error) {
      handleError(error, 'バックアップリストの取得に失敗しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const getStorageInfo = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const info = await storageService.getStorageInfo();
      return info;
    } catch (error) {
      handleError(error, 'ストレージ情報の取得に失敗しました');
      return {
        totalKeys: 0,
        totalSize: 0,
        keyDetails: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const syncWithRedux = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const [preferences, favConversations, unlockedContentIds] = await Promise.all([
        storageService.getUserPreferences(),
        storageService.getFavoriteConversations(),
        storageService.getUnlockedContent(),
      ]);

      if (preferences) {
        dispatch(updatePreferences(preferences));
      }

      favConversations.forEach(conversationId => {
        dispatch(addFavoriteConversation(conversationId));
      });

      unlockedContentIds.forEach(contentId => {
        dispatch(unlockContent(contentId));
      });
    } catch (error) {
      handleError(error, 'データの同期に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, handleError, clearError]);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await storageService.migrateDataIfNeeded();
        await syncWithRedux();
      } catch (error) {
        console.error('Storage initialization failed:', error);
      }
    };

    initializeStorage();
  }, [syncWithRedux]);

  useEffect(() => {
    const autoSave = async () => {
      if (userProfile) {
        try {
          await storageService.saveUserProfile(userProfile);
        } catch (error) {
          console.error('Auto-save profile failed:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [userProfile]);

  useEffect(() => {
    const autoSaveFavorites = async () => {
      try {
        await storageService.saveFavoriteConversations(favoriteConversations);
      } catch (error) {
        console.error('Auto-save favorite conversations failed:', error);
      }
    };

    const timeoutId = setTimeout(autoSaveFavorites, 1000);
    return () => clearTimeout(timeoutId);
  }, [favoriteConversations]);

  useEffect(() => {
    const autoSaveUnlocked = async () => {
      try {
        await storageService.saveUnlockedContent(unlockedContent);
      } catch (error) {
        console.error('Auto-save unlocked content failed:', error);
      }
    };

    const timeoutId = setTimeout(autoSaveUnlocked, 1000);
    return () => clearTimeout(timeoutId);
  }, [unlockedContent]);

  return {
    isLoading,
    error,
    saveProfile,
    loadProfile,
    savePreferences,
    loadPreferences,
    saveFavoriteConversations,
    loadFavoriteConversations,
    saveUnlockedContent,
    loadUnlockedContent,
    exportData,
    importData,
    clearAllData,
    createBackup,
    restoreFromBackup,
    getAvailableBackups,
    getStorageInfo,
    syncWithRedux,
  };
};