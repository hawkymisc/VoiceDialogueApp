// Mock React Native modules that aren't available in test environment
jest.mock('react-native', () => {
  const RN = {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
      })),
    },
    Alert: {
      alert: jest.fn(),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
      watchKeys: jest.fn(() => ({
        remove: jest.fn(),
      })),
    },
    NativeModules: {
      SettingsManager: {
        settings: {},
        getConstants: () => ({}),
      },
    },
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({
        getConstants: () => ({}),
      })),
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    StatusBar: {
      setBarStyle: jest.fn(),
      setHidden: jest.fn(),
      setBackgroundColor: jest.fn(),
      setTranslucent: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve(true)),
      PERMISSIONS: {
        RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    },
    DeviceEventEmitter: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
  };
  
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return React.forwardRef(() => React.createElement('Text', {}, 'Icon'));
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return React.forwardRef(() => React.createElement('Text', {}, 'Icon'));
});

jest.mock('react-native-vector-icons/FontAwesome', () => {
  const React = require('react');
  return React.forwardRef(() => React.createElement('Text', {}, 'Icon'));
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: 'SafeAreaProvider',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Mock react-native-sound
jest.mock('react-native-sound', () => {
  const mockSound = {
    play: jest.fn((callback) => callback && callback(true)),
    pause: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
    setSpeed: jest.fn(),
    getCurrentTime: jest.fn((callback) => callback(0)),
    getDuration: jest.fn(() => 100),
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockSound),
    setCategory: jest.fn(),
    MAIN_BUNDLE: 'MAIN_BUNDLE',
    DOCUMENT: 'DOCUMENT',
    LIBRARY: 'LIBRARY',
    CACHES: 'CACHES',
  };
});

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(''),
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  readDir: jest.fn().mockResolvedValue([]),
}));

// Mock crypto-js for security service tests
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('encrypted-data'),
    }),
    decrypt: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('decrypted-data'),
    }),
  },
  enc: {
    Utf8: {
      stringify: jest.fn().mockReturnValue('utf8-string'),
      parse: jest.fn().mockReturnValue({}),
    },
  },
  PBKDF2: jest.fn().mockReturnValue('derived-key'),
  lib: {
    WordArray: {
      random: jest.fn().mockReturnValue('random-salt'),
    },
  },
  SHA256: jest.fn().mockReturnValue('hashed-value'),
}));

// Set up global test environment
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for more predictable tests
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Set up fetch mock
global.fetch = jest.fn();

// Set up AbortController for fetch
global.AbortController = class AbortController {
  signal = { aborted: false };
  abort() {
    this.signal.aborted = true;
  }
};

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.AZURE_SPEECH_KEY = 'test-azure-key';
process.env.AZURE_SPEECH_REGION = 'test-region';

// Mock storageService for integration tests
jest.mock('../../services/storageService', () => ({
  storageService: {
    saveUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    saveUserPreferences: jest.fn(),
    getUserPreferences: jest.fn(),
    saveFavoriteConversations: jest.fn(),
    getFavoriteConversations: jest.fn(),
    saveUnlockedContent: jest.fn(),
    getUnlockedContent: jest.fn(),
    clearAllData: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
  },
}));

// Mock progressionService
jest.mock('../../services/progressionService', () => ({
  progressionService: {
    initialize: jest.fn(),
    getUserProgress: jest.fn(),
    updateProgress: jest.fn(),
    checkAchievements: jest.fn(),
    getAchievements: jest.fn(),
    getMilestones: jest.fn(),
    updateWeeklyGoals: jest.fn(),
    calculateStreakProgress: jest.fn(),
  },
}));

// Mock openaiService
jest.mock('../../services/openaiService', () => ({
  openaiService: {
    generateDialogue: jest.fn(),
    generateEmotion: jest.fn(),
    createChatCompletion: jest.fn(),
    analyzeConversation: jest.fn(),
  },
}));

// Mock dailyContentService
jest.mock('../../services/dailyContentService', () => ({
  dailyContentService: {
    getDailyContent: jest.fn(),
    generateDailyConversation: jest.fn(),
    getSeasonalContent: jest.fn(),
    getEventContent: jest.fn(),
  },
}));

// Set up longer timeout for integration tests
jest.setTimeout(30000);

export {};