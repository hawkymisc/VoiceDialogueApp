// Mock for react-native-gesture-handler in web environment
import React from 'react';

export const GestureHandlerRootView = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const PanGestureHandler = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const TapGestureHandler = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const LongPressGestureHandler = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8
};

export const gestureHandlerRootHOC = (Component) => Component;

export default {
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  Directions,
  gestureHandlerRootHOC
};