import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Switch,
} from 'react-native';
import {CustomSlider} from './CustomSlider';

const {width: screenWidth} = Dimensions.get('window');

export interface AudioControllerProps {
  audioUrl: string;
  isPlaying: boolean;
  volume: number; // 0-100
  speed: number; // 0.5-2.0
  currentTime: number; // in seconds
  duration: number; // in seconds
  isLooping?: boolean;
  autoPlay?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle?: (loop: boolean) => void;
  onAutoPlayToggle?: (autoPlay: boolean) => void;
}

export const AudioController: React.FC<AudioControllerProps> = ({
  audioUrl,
  isPlaying,
  volume,
  speed,
  currentTime,
  duration,
  isLooping = false,
  autoPlay = false,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onSpeedChange,
  onLoopToggle,
  onAutoPlayToggle,
}) => {
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulse animation when playing
    if (isPlaying) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
      return () => {}; // Return empty cleanup function
    }
  }, [isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayButtonText = (): string => {
    if (!audioUrl) {
      return '音声なし';
    }
    if (isPlaying) {
      return '⏸️';
    }
    return '▶️';
  };

  const getSpeedLabel = (speedValue: number): string => {
    if (speedValue <= 0.75) {
      return '遅い';
    }
    if (speedValue <= 1.25) {
      return '標準';
    }
    return '速い';
  };

  const getVolumeIcon = (volumeValue: number): string => {
    if (volumeValue === 0) {
      return '🔇';
    }
    if (volumeValue < 30) {
      return '🔈';
    }
    if (volumeValue < 70) {
      return '🔉';
    }
    return '🔊';
  };

  return (
    <View style={styles.container}>
      {/* Main Controls */}
      <View style={styles.mainControls}>
        <Animated.View style={[{transform: [{scale: pulseAnim}]}]}>
          <TouchableOpacity
            style={[styles.playButton, !audioUrl && styles.playButtonDisabled]}
            onPress={isPlaying ? onPause : onPlay}
            disabled={!audioUrl}>
            <Text style={styles.playButtonText}>{getPlayButtonText()}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.stopButton,
            (!audioUrl || !isPlaying) && styles.stopButtonDisabled,
          ]}
          onPress={onStop}
          disabled={!audioUrl || !isPlaying}>
          <Text style={styles.stopButtonText}>⏹️</Text>
        </TouchableOpacity>

        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {audioUrl && duration > 0 && (
        <View style={styles.progressContainer}>
          <CustomSlider
            style={styles.progressSlider}
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            onValueChange={onSeek}
            minimumTrackTintColor="#2196f3"
            maximumTrackTintColor="#ddd"
            thumbStyle={styles.sliderThumb}
            disabled={!audioUrl}
          />
        </View>
      )}

      {/* Quick Volume Control */}
      <View style={styles.quickControls}>
        <View style={styles.volumeQuickControl}>
          <Text style={styles.controlIcon}>{getVolumeIcon(volume)}</Text>
          <CustomSlider
            style={styles.volumeSlider}
            value={volume}
            minimumValue={0}
            maximumValue={100}
            onValueChange={onVolumeChange}
            minimumTrackTintColor="#4caf50"
            maximumTrackTintColor="#ddd"
            thumbStyle={styles.sliderThumb}
          />
          <Text style={styles.volumeText}>{Math.round(volume)}</Text>
        </View>

        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedControls(!showAdvancedControls)}>
          <Text style={styles.advancedToggleText}>
            詳細 {showAdvancedControls ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <View style={styles.advancedControls}>
          {/* Playback Options */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>再生オプション</Text>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>リピート再生</Text>
                <Switch
                  value={isLooping}
                  onValueChange={onLoopToggle}
                  trackColor={{false: '#ddd', true: '#4caf50'}}
                  thumbColor={isLooping ? '#fff' : '#f4f3f4'}
                />
              </View>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>自動再生</Text>
                <Switch
                  value={autoPlay}
                  onValueChange={onAutoPlayToggle}
                  trackColor={{false: '#ddd', true: '#2196f3'}}
                  thumbColor={autoPlay ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          {/* Speed Control */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>
              再生速度: {speed.toFixed(1)}x ({getSpeedLabel(speed)})
            </Text>
            <CustomSlider
              style={styles.controlSlider}
              value={speed}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              onValueChange={onSpeedChange}
              minimumTrackTintColor="#ff9800"
              maximumTrackTintColor="#ddd"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.speedPresets}>
              {[0.75, 1.0, 1.25, 1.5].map(presetSpeed => (
                <TouchableOpacity
                  key={presetSpeed}
                  style={[
                    styles.speedPreset,
                    Math.abs(speed - presetSpeed) < 0.05 &&
                      styles.speedPresetActive,
                  ]}
                  onPress={() => onSpeedChange(presetSpeed)}>
                  <Text
                    style={[
                      styles.speedPresetText,
                      Math.abs(speed - presetSpeed) < 0.05 &&
                        styles.speedPresetTextActive,
                    ]}>
                    {presetSpeed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Volume Control (Detailed) */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>音量: {Math.round(volume)}%</Text>
            <CustomSlider
              style={styles.controlSlider}
              value={volume}
              minimumValue={0}
              maximumValue={100}
              step={5}
              onValueChange={onVolumeChange}
              minimumTrackTintColor="#4caf50"
              maximumTrackTintColor="#ddd"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.volumePresets}>
              {[25, 50, 75, 100].map(presetVolume => (
                <TouchableOpacity
                  key={presetVolume}
                  style={[
                    styles.volumePreset,
                    Math.abs(volume - presetVolume) < 3 &&
                      styles.volumePresetActive,
                  ]}
                  onPress={() => onVolumeChange(presetVolume)}>
                  <Text
                    style={[
                      styles.volumePresetText,
                      Math.abs(volume - presetVolume) < 3 &&
                        styles.volumePresetTextActive,
                    ]}>
                    {presetVolume}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Audio Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {!audioUrl
            ? '音声が読み込まれていません'
            : isPlaying
            ? '再生中'
            : '一時停止中'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: '#2196f3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonDisabled: {
    backgroundColor: '#ccc',
  },
  playButtonText: {
    fontSize: 20,
    color: 'white',
  },
  stopButton: {
    backgroundColor: '#f44336',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopButtonDisabled: {
    backgroundColor: '#ccc',
  },
  stopButtonText: {
    fontSize: 16,
    color: 'white',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  quickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeQuickControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
  volumeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  advancedToggle: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 12,
  },
  advancedToggleText: {
    fontSize: 12,
    color: '#666',
  },
  advancedControls: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  controlGroup: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    flex: 1,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  controlSlider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderThumb: {
    backgroundColor: '#2196f3',
    width: 20,
    height: 20,
  },
  speedPresets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  speedPreset: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  speedPresetActive: {
    backgroundColor: '#ff9800',
  },
  speedPresetText: {
    fontSize: 12,
    color: '#666',
  },
  speedPresetTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  volumePresets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  volumePreset: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  volumePresetActive: {
    backgroundColor: '#4caf50',
  },
  volumePresetText: {
    fontSize: 12,
    color: '#666',
  },
  volumePresetTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
