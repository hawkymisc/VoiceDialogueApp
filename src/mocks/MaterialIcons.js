// Mock for react-native-vector-icons/MaterialIcons in web environment
import React from 'react';

const MaterialIcons = ({ name, size = 24, color = '#000', ...props }) => {
  // Simple text-based icon representation for web
  const iconMap = {
    'play-arrow': '▶',
    'pause': '⏸',
    'stop': '⏹',
    'volume-up': '🔊',
    'volume-off': '🔇',
    'favorite': '❤',
    'favorite-border': '🤍',
    'share': '📤',
    'settings': '⚙',
    'home': '🏠',
    'person': '👤',
    'chat': '💬',
    'mic': '🎤',
    'headphones': '🎧',
    'music-note': '🎵',
    'star': '⭐',
    'star-border': '☆'
  };

  const icon = iconMap[name] || '?';

  return React.createElement('span', {
    ...props,
    style: {
      fontSize: size,
      color: color,
      fontFamily: 'system-ui',
      display: 'inline-block',
      ...props.style
    }
  }, icon);
};

export default MaterialIcons;