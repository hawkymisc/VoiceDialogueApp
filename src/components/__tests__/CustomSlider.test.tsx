import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {CustomSlider} from '../CustomSlider';

describe('CustomSlider', () => {
  const mockOnValueChange = jest.fn();
  const defaultProps = {
    value: 50,
    minimumValue: 0,
    maximumValue: 100,
    onValueChange: mockOnValueChange,
  };

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders with correct initial value', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} value={75} />,
    );
    
    // Check if thumb is positioned correctly (75% of track width)
    const thumb = getByTestId('slider-thumb');
    expect(thumb.props.style).toMatchObject({
      left: '75%',
    });
  });

  it('renders with minimum value', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} value={0} />,
    );
    
    const thumb = getByTestId('slider-thumb');
    expect(thumb.props.style).toMatchObject({
      left: '0%',
    });
  });

  it('renders with maximum value', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} value={100} />,
    );
    
    const thumb = getByTestId('slider-thumb');
    expect(thumb.props.style).toMatchObject({
      left: '100%',
    });
  });

  it('handles track press correctly', () => {
    const {getByTestId} = render(<CustomSlider {...defaultProps} />);
    
    const track = getByTestId('slider-track');
    fireEvent.press(track, {
      nativeEvent: {
        locationX: 200, // Assuming track width is 400, this is 50%
      },
    });

    expect(mockOnValueChange).toHaveBeenCalledWith(50);
  });

  it('respects step value', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} step={10} />,
    );
    
    const track = getByTestId('slider-track');
    fireEvent.press(track, {
      nativeEvent: {
        locationX: 156, // Should round to nearest step
      },
    });

    expect(mockOnValueChange).toHaveBeenCalledWith(40);
  });

  it('handles custom colors', () => {
    const {getByTestId} = render(
      <CustomSlider
        {...defaultProps}
        minimumTrackTintColor="#FF0000"
        maximumTrackTintColor="#00FF00"
      />,
    );
    
    const track = getByTestId('slider-track');
    const minimumTrack = getByTestId('slider-minimum-track');
    const thumb = getByTestId('slider-thumb');
    
    expect(track.props.style).toMatchObject({
      backgroundColor: '#00FF00',
    });
    expect(minimumTrack.props.style).toMatchObject({
      backgroundColor: '#FF0000',
    });
    expect(thumb.props.style).toMatchObject({
      backgroundColor: '#FF0000',
    });
  });

  it('handles disabled state', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} disabled={true} />,
    );
    
    const track = getByTestId('slider-track');
    const thumb = getByTestId('slider-thumb');
    
    // Press should not call onValueChange when disabled
    fireEvent.press(track, {
      nativeEvent: {
        locationX: 200,
      },
    });

    expect(mockOnValueChange).not.toHaveBeenCalled();
    
    // Thumb should have reduced opacity
    expect(thumb.props.style).toMatchObject({
      opacity: 0.5,
    });
  });

  it('clamps values to min/max bounds', () => {
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} minimumValue={20} maximumValue={80} />,
    );
    
    const track = getByTestId('slider-track');
    
    // Test value below minimum
    fireEvent.press(track, {
      nativeEvent: {
        locationX: -100, // Negative position
      },
    });
    expect(mockOnValueChange).toHaveBeenCalledWith(20);
    
    // Test value above maximum
    fireEvent.press(track, {
      nativeEvent: {
        locationX: 1000, // Very large position
      },
    });
    expect(mockOnValueChange).toHaveBeenCalledWith(80);
  });

  it('handles pan gesture movement', () => {
    const {getByTestId} = render(<CustomSlider {...defaultProps} />);
    
    const thumb = getByTestId('slider-thumb');
    
    // Simulate pan gesture
    fireEvent(thumb, 'onPanResponderMove', {
      nativeEvent: {
        locationX: 300, // 75% of assumed track width
      },
    });

    expect(mockOnValueChange).toHaveBeenCalledWith(75);
  });

  it('applies custom thumb style', () => {
    const customThumbStyle = {
      width: 30,
      height: 30,
      backgroundColor: '#FF0000',
    };
    
    const {getByTestId} = render(
      <CustomSlider {...defaultProps} thumbStyle={customThumbStyle} />,
    );
    
    const thumb = getByTestId('slider-thumb');
    expect(thumb.props.style).toMatchObject(customThumbStyle);
  });

  it('handles float values correctly', () => {
    const {getByTestId} = render(
      <CustomSlider
        {...defaultProps}
        value={33.333}
        minimumValue={0}
        maximumValue={100}
        step={0.1}
      />,
    );
    
    const track = getByTestId('slider-track');
    fireEvent.press(track, {
      nativeEvent: {
        locationX: 150, // Should result in a stepped float value
      },
    });

    expect(mockOnValueChange).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });
});