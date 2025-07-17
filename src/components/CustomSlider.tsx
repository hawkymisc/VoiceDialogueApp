import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  style?: ViewStyle;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbStyle?: ViewStyle;
  disabled?: boolean;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  style,
  minimumTrackTintColor = '#4A90E2',
  maximumTrackTintColor = '#ddd',
  thumbStyle,
  disabled = false,
}) => {
  const sliderWidth = Dimensions.get('window').width - 64; // Account for padding

  // Calculate percentage for visual representation
  const percentage =
    ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderMove: evt => {
      if (disabled) {return;}

      const {locationX} = evt.nativeEvent;
      const newPercentage = Math.max(
        0,
        Math.min(100, (locationX / sliderWidth) * 100),
      );
      const newValue =
        minimumValue + ((maximumValue - minimumValue) * newPercentage) / 100;
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(
        minimumValue,
        Math.min(maximumValue, steppedValue),
      );

      onValueChange(clampedValue);
    },
  });

  const handleTrackPress = (evt: any) => {
    if (disabled) {return;}

    const {locationX} = evt.nativeEvent;
    const newPercentage = Math.max(
      0,
      Math.min(100, (locationX / sliderWidth) * 100),
    );
    const newValue =
      minimumValue + ((maximumValue - minimumValue) * newPercentage) / 100;
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(
      minimumValue,
      Math.min(maximumValue, steppedValue),
    );

    onValueChange(clampedValue);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.trackContainer}
        onPress={handleTrackPress}
        activeOpacity={1}
        disabled={disabled}>
        <View style={[styles.track, {backgroundColor: maximumTrackTintColor}]}>
          <View
            style={[
              styles.minimumTrack,
              {
                width: `${percentage}%`,
                backgroundColor: minimumTrackTintColor, 
              }
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            thumbStyle,
            {
              left: `${percentage}%`,
              backgroundColor: minimumTrackTintColor,
              opacity: disabled ? 0.5 : 1,
            }
          ]}
          {...panResponder.panHandlers}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  minimumTrack: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 3,
  },
  thumb: {
    width: 24,
    height: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
});
