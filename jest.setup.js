import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock React Native Sound
jest.mock('react-native-sound', () => {
  const mockSound = {
    setCategory: jest.fn(),
    setMode: jest.fn(),
    setActive: jest.fn(),
    MAIN_BUNDLE: '',
    DOCUMENT: '',
    LIBRARY: '',
    CACHES: '',
  };
  
  mockSound.default = mockSound;
  
  return mockSound;
});


// Mock React Native Elements
jest.mock('react-native-elements', () => ({
  Button: 'Button',
  Card: 'Card',
  Header: 'Header',
  Input: 'Input',
  Text: 'Text',
  ThemeProvider: ({ children }) => children,
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {},
  Directions: {},
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    createAnimatedComponent: () => 'AnimatedComponent',
  },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: jest.fn(),
  withSpring: jest.fn(),
  runOnJS: jest.fn(),
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock React Native Screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock React Native components and APIs
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios),
    constants: {
      interfaceIdiom: 'phone',
      osVersion: '14.0',
      systemName: 'iOS',
    },
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Share: {
    share: jest.fn(() => Promise.resolve()),
  },
  Alert: {
    alert: jest.fn(),
    prompt: jest.fn(),
  },
  Text: 'Text',
  View: 'View',
  Image: 'Image',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  FlatList: 'FlatList',
  VirtualizedList: 'VirtualizedList',
  VirtualizedSectionList: 'VirtualizedSectionList',
  SectionList: 'SectionList',
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((styles) => styles),
  },
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    createAnimatedComponent: jest.fn(() => 'AnimatedComponent'),
  },
  Settings: {
    get: jest.fn(),
    set: jest.fn(),
    watchKeys: jest.fn(() => ({ remove: jest.fn() })),
    clearWatch: jest.fn(),
  },
  NativeModules: {
    SettingsManager: {
      getConstants: jest.fn(() => ({})),
      settings: {},
    },
    DevSettings: {
      getConstants: jest.fn(() => ({})),
      reload: jest.fn(),
      onFastRefresh: jest.fn(),
      setHotLoadingEnabled: jest.fn(),
      setLiveReloadEnabled: jest.fn(),
      setProfilingEnabled: jest.fn(),
      addMenuItem: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    PlatformConstants: {
      getConstants: jest.fn(() => ({
        interfaceIdiom: 'phone',
        osVersion: '14.0',
        systemName: 'iOS',
      })),
    },
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn((name) => {
      if (name === 'SettingsManager') {
        return {
          getConstants: jest.fn(() => ({})),
          settings: {},
        };
      }
      return {
        getConstants: jest.fn(() => ({})),
      };
    }),
    get: jest.fn(() => null),
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
  DeviceEventEmitter: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
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
  StatusBar: {
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
  },
  Keyboard: {
    dismiss: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
  PanResponder: {
    create: jest.fn(() => ({
      panHandlers: {},
    })),
  },
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (options) => options.ios,
}));

// Silence warnings
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock global fetch
global.fetch = jest.fn();

// Mock global Audio
global.Audio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
  paused: true,
  ended: false,
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  TemporaryDirectoryPath: '/mock/tmp',
  ExternalDirectoryPath: '/mock/external',
  readFile: jest.fn(() => Promise.resolve('mock file content')),
  writeFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  stat: jest.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false })),
  unlink: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
    jobId: 1,
  })),
}));

// Mock microsoft-cognitiveservices-speech-sdk
jest.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: {
    fromSubscription: jest.fn(() => ({
      speechSynthesisVoiceName: 'ja-JP-KeitaNeural',
      speechSynthesisOutputFormat: 'mp3',
    })),
  },
  SpeechSynthesizer: jest.fn(() => ({
    speakTextAsync: jest.fn((text, onResult, onError) => {
      setTimeout(() => onResult({ audioData: new ArrayBuffer(8) }), 100);
    }),
    close: jest.fn(),
  })),
  SpeechSynthesisOutputFormat: {
    Audio24Khz16BitMonoPcm: 'Audio24Khz16BitMonoPcm',
  },
  ResultReason: {
    SynthesizingAudioCompleted: 'SynthesizingAudioCompleted',
  },
}));

// Mock openai
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                text: 'モックレスポンス',
                emotion: 'happy',
              }),
            },
          }],
        })),
      },
    },
  }));
});

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock Blob
global.Blob = jest.fn(() => ({
  size: 0,
  type: 'text/plain',
}));

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));