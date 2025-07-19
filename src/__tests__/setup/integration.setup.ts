// Mock React Native modules that aren't available in test environment
jest.mock('react-native', () => ({
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
  NativeModules: {},
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
}));

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
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

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

// Set up longer timeout for integration tests
jest.setTimeout(30000);

export {};