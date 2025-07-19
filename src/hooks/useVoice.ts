import {useEffect, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../store/store';
import {
  generateSpeech,
  playAudio,
  setVoiceSettings,
  setAutoPlay,
  stopAllAudio,
  pauseAudio,
  resumeAudio,
  setVolume,
  setSpeed,
  setPitch,
  clearVoiceError,
  selectVoiceState,
  selectIsGenerating,
  selectIsPlaying,
  selectCurrentTrack,
  selectVoiceSettings,
  selectAutoPlay,
  selectVoiceError,
} from '../store/slices/voiceSlice';
import {EmotionState} from '../types/Dialogue';
import {CharacterType} from '../types/Character';
import {AudioTrack} from '../services/audioPlayerService';

export const useVoice = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const voiceState = useSelector(selectVoiceState);
  const isGenerating = useSelector(selectIsGenerating);
  const isPlaying = useSelector(selectIsPlaying);
  const currentTrack = useSelector(selectCurrentTrack);
  const voiceSettings = useSelector(selectVoiceSettings);
  const autoPlay = useSelector(selectAutoPlay);
  const error = useSelector(selectVoiceError);

  // Generate speech for a message
  const generateVoice = useCallback(async (
    text: string,
    characterId: CharacterType,
    emotion: EmotionState,
    messageId: string
  ) => {
    try {
      const resultAction = await dispatch(generateSpeech({
        text,
        characterId,
        emotion,
        messageId,
      }));
      
      if (generateSpeech.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        throw new Error('Failed to generate speech');
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      throw error;
    }
  }, [dispatch]);

  // Play audio track
  const playVoice = useCallback(async (track: AudioTrack) => {
    try {
      await dispatch(playAudio(track));
    } catch (error) {
      console.error('Voice playback error:', error);
      throw error;
    }
  }, [dispatch]);

  // Stop audio
  const stopVoice = useCallback(() => {
    dispatch(stopAllAudio());
  }, [dispatch]);

  // Pause audio
  const pauseVoice = useCallback(() => {
    dispatch(pauseAudio());
  }, [dispatch]);

  // Resume audio
  const resumeVoice = useCallback(() => {
    dispatch(resumeAudio());
  }, [dispatch]);

  // Update voice settings
  const updateVoiceSettings = useCallback((
    characterId: CharacterType,
    settings: Partial<typeof voiceSettings[CharacterType]>
  ) => {
    dispatch(setVoiceSettings({characterId, settings}));
  }, [dispatch]);

  // Update volume
  const updateVolume = useCallback((characterId: CharacterType, volume: number) => {
    dispatch(setVolume({characterId, volume}));
  }, [dispatch]);

  // Update speed
  const updateSpeed = useCallback((characterId: CharacterType, speed: number) => {
    dispatch(setSpeed({characterId, speed}));
  }, [dispatch]);

  // Update pitch
  const updatePitch = useCallback((characterId: CharacterType, pitch: number) => {
    dispatch(setPitch({characterId, pitch}));
  }, [dispatch]);

  // Toggle auto-play
  const toggleAutoPlay = useCallback((enabled: boolean) => {
    dispatch(setAutoPlay(enabled));
  }, [dispatch]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch(clearVoiceError());
  }, [dispatch]);

  // Get voice settings for a character
  const getCharacterVoiceSettings = useCallback((characterId: CharacterType) => {
    return voiceSettings[characterId];
  }, [voiceSettings]);

  // Generate and play voice automatically
  const generateAndPlayVoice = useCallback(async (
    text: string,
    characterId: CharacterType,
    emotion: EmotionState,
    messageId: string
  ) => {
    try {
      const track = await generateVoice(text, characterId, emotion, messageId);
      
      if (autoPlay && track) {
        await playVoice(track);
      }
      
      return track;
    } catch (error) {
      console.error('Generate and play voice error:', error);
      throw error;
    }
  }, [generateVoice, playVoice, autoPlay]);

  return {
    // State
    voiceState,
    isGenerating,
    isPlaying,
    currentTrack,
    voiceSettings,
    autoPlay,
    error,
    
    // Actions
    generateVoice,
    playVoice,
    stopVoice,
    pauseVoice,
    resumeVoice,
    updateVoiceSettings,
    updateVolume,
    updateSpeed,
    updatePitch,
    toggleAutoPlay,
    clearError,
    getCharacterVoiceSettings,
    generateAndPlayVoice,
  };
};

export default useVoice;