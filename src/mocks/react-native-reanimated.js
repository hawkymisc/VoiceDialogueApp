// Mock for react-native-reanimated in web environment
import React from 'react';

export const useSharedValue = (initial) => ({ value: initial });
export const useAnimatedStyle = (fn) => () => ({ style: {} });
export const useDerivedValue = (fn) => ({ value: fn() });
export const withTiming = (value, config, callback) => value;
export const withSpring = (value, config, callback) => value;
export const withDelay = (delay, animation) => animation;
export const withRepeat = (animation, numberOfReps, reverse) => animation;
export const withSequence = (...animations) => animations[0];
export const cancelAnimation = (sharedValue) => {};
export const runOnJS = (fn) => (...args) => fn(...args);
export const runOnUI = (fn) => (...args) => fn(...args);

export const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  bezier: (x1, y1, x2, y2) => (t) => t,
  in: (easing) => easing,
  out: (easing) => easing,
  inOut: (easing) => easing
};

export const Extrapolate = {
  EXTEND: 'extend',
  CLAMP: 'clamp',
  IDENTITY: 'identity'
};

export const interpolate = (value, inputRange, outputRange, extrapolate) => {
  return outputRange[0];
};

export const interpolateColor = (value, inputRange, outputRange, colorSpace) => {
  return outputRange[0];
};

// Animated components
export const View = React.forwardRef((props, ref) => 
  React.createElement('div', { ...props, ref })
);

export const Text = React.forwardRef((props, ref) => 
  React.createElement('span', { ...props, ref })
);

export const ScrollView = React.forwardRef((props, ref) => 
  React.createElement('div', { ...props, ref, style: { ...props.style, overflow: 'auto' } })
);

export const Image = React.forwardRef((props, ref) => 
  React.createElement('img', { ...props, ref })
);

export const FlatList = React.forwardRef((props, ref) => 
  React.createElement('div', { ...props, ref })
);

const Animated = {
  View,
  Text,
  ScrollView,
  Image,
  FlatList
};

export default Animated;