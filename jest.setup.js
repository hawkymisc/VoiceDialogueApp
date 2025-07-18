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
jest.mock('react-native-sound', () => ({
  Sound: jest.fn(() => ({
    play: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    setVolume: jest.fn(),
    setSpeed: jest.fn(),
  })),
}));

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

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  };
  return RN;
});

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