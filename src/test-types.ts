// Test file to verify type definitions work correctly
import {Character, CharacterType, PersonalityTraits} from './types/Character';
import {DialogueMessage, EmotionType, ScenarioType} from './types/Dialogue';
import {UserProfile, UserPreferences} from './types/User';
import {VoiceSynthesisRequest, AudioPlayerState} from './types/Audio';
import {ApiResponse} from './types/Api';

// Test Character types
const testCharacter: Character = {
  id: 'aoi',
  name: '蒼',
  age: 22,
  personality: {
    aggressiveness: 30,
    kindness: 85,
    tsundereLevel: 20,
    shyness: 70,
  },
  appearance: {
    hairColor: 'black',
    eyeColor: 'brown',
    clothing: {
      id: 'casual-1',
      name: 'Casual Outfit',
      category: 'casual',
      imageUrl: '/images/casual-1.png',
    },
    expressions: {
      neutral: '/expressions/neutral.png',
      happy: '/expressions/happy.png',
      sad: '/expressions/sad.png',
      angry: '/expressions/angry.png',
      surprised: '/expressions/surprised.png',
      embarrassed: '/expressions/embarrassed.png',
    },
  },
  voiceSettings: {
    pitch: 75,
    tone: 'gentle',
    speed: 1.0,
    emotionalRange: 80,
    voiceId: 'ja-JP-KeitaNeural',
  },
  description: '22歳の美青年',
  backstory: '純真で感情豊かな青年',
};

// Test Dialogue types
const testMessage: DialogueMessage = {
  id: 'msg-001',
  sender: 'character',
  text: 'こんにちは！今日はいい天気ですね。',
  emotion: 'happy',
  timestamp: Date.now(),
  audioUrl: '/audio/msg-001.mp3',
  metadata: {
    scenario: 'daily',
    context: ['greeting', 'weather'],
    userRating: 5,
    isFavorite: true,
  },
};

// Test User types
const testUserProfile: UserProfile = {
  id: 'user-001',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date(),
  lastLoginAt: new Date(),
  preferences: {
    favoriteScenarios: ['daily', 'romance'],
    characterCustomizations: {
      aoi: {
        personality: {
          kindness: 80,
          aggressiveness: 40,
          tsundereLevel: 30,
          shyness: 50,
        },
        appearance: {
          hairColor: '#4A90E2',
          eyeColor: '#2E5BBA',
          clothing: {
            id: 'aoi_casual_01',
            name: 'カジュアルシャツ',
            category: 'casual',
            imageUrl: '/assets/clothing/aoi_casual_01.png',
          },
          expressions: {
            neutral: '/assets/expressions/aoi_neutral.png',
            happy: '/assets/expressions/aoi_happy.png',
            sad: '/assets/expressions/aoi_sad.png',
            angry: '/assets/expressions/aoi_angry.png',
            surprised: '/assets/expressions/aoi_surprised.png',
            embarrassed: '/assets/expressions/aoi_embarrassed.png',
          },
        },
        voiceSettings: {
          pitch: 75,
          speed: 1.0,
          emotionalRange: 80,
          tone: 'clear_young_male',
          voiceId: 'ja-JP-KeitaNeural',
        },
      },
      shun: {
        personality: {
          kindness: 70,
          aggressiveness: 60,
          tsundereLevel: 25,
          shyness: 20,
        },
        appearance: {
          hairColor: '#2C1810',
          eyeColor: '#4A3728',
          clothing: {
            id: 'shun_business_01',
            name: 'ビジネススーツ',
            category: 'formal',
            imageUrl: '/assets/clothing/shun_business_01.png',
          },
          expressions: {
            neutral: '/assets/expressions/shun_neutral.png',
            happy: '/assets/expressions/shun_happy.png',
            sad: '/assets/expressions/shun_sad.png',
            angry: '/assets/expressions/shun_angry.png',
            surprised: '/assets/expressions/shun_surprised.png',
            embarrassed: '/assets/expressions/shun_embarrassed.png',
          },
        },
        voiceSettings: {
          pitch: 35,
          speed: 0.9,
          emotionalRange: 60,
          tone: 'mature_male',
          voiceId: 'ja-JP-DaichiNeural',
        },
      },
    },
    audioSettings: {
      volume: 80,
      speed: 1.0,
      autoPlay: true,
      enableSoundEffects: true,
      preferredVoiceQuality: 'high',
    },
    privacySettings: {
      shareConversations: false,
      allowDataCollection: true,
      showOnlineStatus: false,
      enableAnalytics: true,
      ageVerified: true,
    },
    relationshipSettings: {
      aoi: {type: 'childhood-friends', intimacyLevel: 75, trustLevel: 80},
      shun: {type: 'senpai-kohai', intimacyLevel: 40, trustLevel: 50},
    },
    language: 'ja',
    theme: 'auto',
  },
  statistics: {
    totalConversations: 15,
    favoriteCharacter: 'aoi',
    averageSessionLength: 25,
    lastActiveDate: new Date(),
    totalPlayTime: 375,
    conversationsByScenario: {
      'daily': 8,
      'work': 3,
      'special': 2,
      'drama': 1,
      'comedy': 1,
      'romance': 0,
    },
    favoriteEmotions: ['happy', 'embarrassed'],
    achievementCount: 5,
  },
  subscriptionTier: 'premium',
  isActive: true,
};

// Test Audio types
const testVoiceRequest: VoiceSynthesisRequest = {
  text: 'こんにちは、元気ですか？',
  characterId: 'aoi',
  emotion: 'happy',
  speed: 1.0,
  pitch: 75,
  volume: 80,
};

const testAudioState: AudioPlayerState = {
  isPlaying: false,
  currentAudioUrl: null,
  volume: 80,
  speed: 1.0,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  error: null,
};

// Test API types
const testApiResponse: ApiResponse<Character> = {
  success: true,
  data: testCharacter,
  timestamp: new Date(),
};

// Type assertion tests to ensure types are working
const characterType: CharacterType = 'aoi';
const emotionType: EmotionType = 'joy';
const scenarioType: ScenarioType = 'daily-conversation';

console.log('All type definitions are working correctly!');
console.log('Test character:', testCharacter.name);
console.log('Test message:', testMessage.text);
console.log('Test user:', testUserProfile.username);

export {
  testCharacter,
  testMessage,
  testUserProfile,
  testVoiceRequest,
  testAudioState,
  testApiResponse,
};
