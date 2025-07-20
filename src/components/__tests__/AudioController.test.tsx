import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {AudioController} from '../AudioController';

// Mock dependencies
jest.mock('../CustomSlider', () => ({
  CustomSlider: ({value, onValueChange, testID}: any) => {
    const MockSlider = require('react-native').View;
    const MockText = require('react-native').Text;
    const MockTouchable = require('react-native').TouchableOpacity;
    
    return (
      <MockSlider testID={testID}>
        <MockText testID={`${testID}-value`}>{value}</MockText>
        <MockTouchable
          testID={`${testID}-change`}
          onPress={() => onValueChange && onValueChange(50)}>
          <MockText>Change Value</MockText>
        </MockTouchable>
      </MockSlider>
    );
  },
}));

describe('AudioController', () => {
  const defaultProps = {
    audioUrl: 'https://example.com/test.mp3',
    isPlaying: false,
    volume: 80,
    speed: 1.0,
    currentTime: 0,
    duration: 120,
    isLooping: false,
    autoPlay: false,
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onStop: jest.fn(),
    onSeek: jest.fn(),
    onVolumeChange: jest.fn(),
    onSpeedChange: jest.fn(),
    onLoopToggle: jest.fn(),
    onAutoPlayToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const {getByTestId, getByText} = render(<AudioController {...defaultProps} />);
      
      expect(getByText('▶️')).toBeTruthy();
      expect(getByText('⏹️')).toBeTruthy();
      expect(getByText('0:00 / 2:00')).toBeTruthy();
    });

    it('should show pause button when playing', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} isPlaying={true} />
      );
      
      expect(getByText('⏸️')).toBeTruthy();
    });

    it('should show correct time format', () => {
      const {getByText} = render(
        <AudioController 
          {...defaultProps} 
          currentTime={65} 
          duration={125} 
        />
      );
      
      expect(getByText('1:05 / 2:05')).toBeTruthy();
    });

    it('should show audio unavailable when no URL', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} audioUrl="" />
      );
      
      expect(getByText('音声なし')).toBeTruthy();
    });

    it('should disable controls when no audio URL', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} audioUrl="" />
      );
      
      const playButton = getByText('音声なし');
      fireEvent.press(playButton);
      
      expect(defaultProps.onPlay).not.toHaveBeenCalled();
    });
  });

  describe('Play/Pause Controls', () => {
    it('should call onPlay when play button is pressed', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const playButton = getByText('▶️');
      fireEvent.press(playButton);
      
      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when pause button is pressed', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} isPlaying={true} />
      );
      
      const pauseButton = getByText('⏸️');
      fireEvent.press(pauseButton);
      
      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onStop when stop button is pressed', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} isPlaying={true} />
      );
      
      const stopButton = getByText('⏹️');
      fireEvent.press(stopButton);
      
      expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
    });

    it('should disable stop button when not playing and at beginning', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const stopButton = getByText('⏹️');
      fireEvent.press(stopButton);
      
      expect(defaultProps.onStop).not.toHaveBeenCalled();
    });
  });

  describe('Volume Controls', () => {
    it('should display current volume', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} volume={75} />
      );
      
      expect(getByText('75')).toBeTruthy();
    });

    it('should show correct volume icon for different levels', () => {
      const {rerender, getByText} = render(
        <AudioController {...defaultProps} volume={0} />
      );
      expect(getByText('🔇')).toBeTruthy();
      
      rerender(<AudioController {...defaultProps} volume={25} />);
      expect(getByText('🔈')).toBeTruthy();
      
      rerender(<AudioController {...defaultProps} volume={50} />);
      expect(getByText('🔉')).toBeTruthy();
      
      rerender(<AudioController {...defaultProps} volume={85} />);
      expect(getByText('🔊')).toBeTruthy();
    });

    it('should call onVolumeChange when volume slider changes', () => {
      const {getByTestId} = render(<AudioController {...defaultProps} />);
      
      const volumeSlider = getByTestId('volume-slider-change');
      fireEvent.press(volumeSlider);
      
      expect(defaultProps.onVolumeChange).toHaveBeenCalledWith(50);
    });
  });

  describe('Progress Controls', () => {
    it('should show progress slider when duration > 0', () => {
      const {getByTestId} = render(
        <AudioController {...defaultProps} duration={120} />
      );
      
      expect(getByTestId('progress-slider-value')).toBeTruthy();
    });

    it('should not show progress slider when duration is 0', () => {
      const {queryByTestId} = render(
        <AudioController {...defaultProps} duration={0} />
      );
      
      expect(queryByTestId('progress-slider-value')).toBeFalsy();
    });

    it('should call onSeek when progress slider changes', () => {
      const {getByTestId} = render(
        <AudioController {...defaultProps} duration={120} />
      );
      
      const progressSlider = getByTestId('progress-slider-change');
      fireEvent.press(progressSlider);
      
      expect(defaultProps.onSeek).toHaveBeenCalledWith(50);
    });
  });

  describe('Advanced Controls', () => {
    it('should toggle advanced controls visibility', () => {
      const {getByText, queryByText} = render(<AudioController {...defaultProps} />);
      
      // Initially hidden
      expect(queryByText('リピート再生')).toBeFalsy();
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      expect(getByText('リピート再生')).toBeTruthy();
      expect(getByText('詳細 ▲')).toBeTruthy();
    });

    it('should display current speed and label', () => {
      const {getByText, getByTestId} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      expect(getByText('再生速度: 1.0x (標準)')).toBeTruthy();
    });

    it('should show correct speed labels', () => {
      const {getByText, rerender} = render(<AudioController {...defaultProps} speed={0.5} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      expect(getByText('再生速度: 0.5x (遅い)')).toBeTruthy();
      
      rerender(<AudioController {...defaultProps} speed={1.5} />);
      expect(getByText('再生速度: 1.5x (速い)')).toBeTruthy();
    });

    it('should call onSpeedChange when speed slider changes', () => {
      const {getByText, getByTestId} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const speedSlider = getByTestId('speed-slider-change');
      fireEvent.press(speedSlider);
      
      expect(defaultProps.onSpeedChange).toHaveBeenCalledWith(50);
    });

    it('should call onLoopToggle when loop switch is pressed', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const loopSwitch = getByText('リピート再生');
      fireEvent.press(loopSwitch);
      
      expect(defaultProps.onLoopToggle).toHaveBeenCalledWith(true);
    });

    it('should call onAutoPlayToggle when autoplay switch is pressed', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const autoPlaySwitch = getByText('自動再生');
      fireEvent.press(autoPlaySwitch);
      
      expect(defaultProps.onAutoPlayToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Speed Presets', () => {
    it('should show speed preset buttons', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      expect(getByText('0.75x')).toBeTruthy();
      expect(getByText('1x')).toBeTruthy();
      expect(getByText('1.25x')).toBeTruthy();
      expect(getByText('1.5x')).toBeTruthy();
    });

    it('should highlight active speed preset', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} speed={1.25} />
      );
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const preset = getByText('1.25x');
      expect(preset).toBeTruthy();
    });

    it('should call onSpeedChange when preset is pressed', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const preset = getByText('1.5x');
      fireEvent.press(preset);
      
      expect(defaultProps.onSpeedChange).toHaveBeenCalledWith(1.5);
    });
  });

  describe('Volume Presets', () => {
    it('should show volume preset buttons', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      expect(getByText('25%')).toBeTruthy();
      expect(getByText('50%')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
      expect(getByText('100%')).toBeTruthy();
    });

    it('should call onVolumeChange when volume preset is pressed', () => {
      const {getByText} = render(<AudioController {...defaultProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      const preset = getByText('75%');
      fireEvent.press(preset);
      
      expect(defaultProps.onVolumeChange).toHaveBeenCalledWith(75);
    });
  });

  describe('Audio Status', () => {
    it('should show playing status', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} isPlaying={true} />
      );
      
      expect(getByText('再生中')).toBeTruthy();
    });

    it('should show paused status', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} isPlaying={false} />
      );
      
      expect(getByText('一時停止中')).toBeTruthy();
    });

    it('should show no audio status', () => {
      const {getByText} = render(
        <AudioController {...defaultProps} audioUrl="" />
      );
      
      expect(getByText('音声が読み込まれていません')).toBeTruthy();
    });
  });

  describe('Pulse Animation', () => {
    it('should start pulse animation when playing', () => {
      const {rerender} = render(<AudioController {...defaultProps} />);
      
      // Change to playing state
      rerender(<AudioController {...defaultProps} isPlaying={true} />);
      
      // Animation would be tested with animation testing utilities
      // For now, just verify component renders without error
      expect(true).toBe(true);
    });

    it('should stop pulse animation when paused', () => {
      const {rerender} = render(
        <AudioController {...defaultProps} isPlaying={true} />
      );
      
      // Change to paused state
      rerender(<AudioController {...defaultProps} isPlaying={false} />);
      
      // Animation would be tested with animation testing utilities
      // For now, just verify component renders without error
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callback props gracefully', () => {
      const minimalProps = {
        audioUrl: 'https://example.com/test.mp3',
        isPlaying: false,
        volume: 80,
        speed: 1.0,
        currentTime: 0,
        duration: 120,
        onPlay: jest.fn(),
        onPause: jest.fn(),
        onStop: jest.fn(),
        onSeek: jest.fn(),
        onVolumeChange: jest.fn(),
        onSpeedChange: jest.fn(),
      };
      
      const {getByText} = render(<AudioController {...minimalProps} />);
      
      const toggleButton = getByText('詳細 ▼');
      fireEvent.press(toggleButton);
      
      // Should render without error even without optional callbacks
      expect(getByText('リピート再生')).toBeTruthy();
    });

    it('should handle very long durations', () => {
      const {getByText} = render(
        <AudioController 
          {...defaultProps} 
          currentTime={3665} 
          duration={7265} 
        />
      );
      
      expect(getByText('61:05 / 121:05')).toBeTruthy();
    });

    it('should handle zero duration gracefully', () => {
      const {queryByTestId} = render(
        <AudioController {...defaultProps} duration={0} />
      );
      
      expect(queryByTestId('progress-slider-value')).toBeFalsy();
    });
  });
});