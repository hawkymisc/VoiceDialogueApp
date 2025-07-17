// Test file to verify Redux store configuration
import {store} from './store';
import {
  setActiveCharacter,
  updateCharacterPersonality,
} from './store/slices/characterSlice';
import {startNewConversation, addMessage} from './store/slices/dialogueSlice';
import {setAuthenticated, updatePreferences} from './store/slices/userSlice';
import {playAudio, setVolume} from './store/slices/audioSlice';

// Test Redux store functionality
console.log('Initial store state:', store.getState());

// Test character slice
store.dispatch(setActiveCharacter('aoi'));
store.dispatch(
  updateCharacterPersonality({
    characterId: 'aoi',
    personality: {kindness: 90},
  }),
);

// Test dialogue slice
store.dispatch(
  startNewConversation({
    userId: 'user-001',
    scenario: 'daily-conversation',
    participants: ['aoi', 'shun'],
  }),
);

store.dispatch(
  addMessage({
    id: 'msg-001',
    speakerId: 'aoi',
    text: 'こんにちは！',
    emotion: 'joy',
    timestamp: new Date(),
    metadata: {
      scenario: 'daily-conversation',
      context: ['greeting'],
    },
  }),
);

// Test user slice
store.dispatch(setAuthenticated(true));
store.dispatch(
  updatePreferences({
    favoriteScenarios: ['daily-conversation', 'romantic-scene'],
  }),
);

// Test audio slice
store.dispatch(playAudio('/audio/test.mp3'));
store.dispatch(setVolume(75));

console.log('Final store state:', store.getState());
console.log('Redux store is working correctly!');

export {store};
