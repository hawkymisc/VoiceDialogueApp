// Mock for react-native-safe-area-context in web environment
import React from 'react';

export const SafeAreaProvider = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      height: '100vh',
      width: '100vw',
      ...props.style
    }
  }, children);
};

export const SafeAreaView = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      flex: 1,
      ...props.style
    }
  }, children);
};

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
});

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: window.innerWidth || 375,
  height: window.innerHeight || 667
});

// Additional exports needed by React Navigation
export const initialWindowMetrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 375, height: 667 }
};

export const SafeAreaInsetsContext = React.createContext({
  top: 0, bottom: 0, left: 0, right: 0
});

export const SafeAreaFrameContext = React.createContext({
  x: 0, y: 0, width: 375, height: 667
});

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
  SafeAreaInsetsContext,
  SafeAreaFrameContext
};