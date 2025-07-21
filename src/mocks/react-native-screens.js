// Mock for react-native-screens in web environment
import React from 'react';

export const Screen = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      flex: 1,
      ...props.style
    }
  }, children);
};

export const ScreenContainer = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      flex: 1,
      ...props.style
    }
  }, children);
};

export const enableScreens = (enable = true) => {
  console.warn('enableScreens called in web environment - no-op');
};

// Additional navigation-related mocks
export const ScreenStack = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      flex: 1,
      ...props.style
    }
  }, children);
};

export const ScreenStackHeaderConfig = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const ScreenStackHeaderCenterView = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

// Mock the setMode function that might be causing issues
const mockScreensModule = {
  setMode: (mode) => {
    console.warn('react-native-screens setMode called in web environment:', mode);
  },
  enableScreens,
  Screen,
  ScreenContainer,
  ScreenStack,
  ScreenStackHeaderConfig,
  ScreenStackHeaderCenterView
};

export default mockScreensModule;