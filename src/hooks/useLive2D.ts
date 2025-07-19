import {useEffect, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../store/store';
import {
  initializeLive2D,
  loadModel,
  setExpression,
  playMotion,
  startLipSync,
  setParameter,
  updateViewport,
  setAutoBlinking,
  setAutoBreathing,
  setEyeTrackingTarget,
  stopLipSync,
  clearLive2DError,
  disposeLive2D,
  selectLive2DState,
  selectCurrentModel,
  selectCurrentExpression,
  selectCurrentMotion,
  selectIsLoading,
  selectLive2DError,
} from '../store/slices/live2dSlice';
import {EmotionState} from '../types/Dialogue';
import {CharacterType} from '../types/Character';
import {Live2DMotion} from '../types/Live2D';

export const useLive2D = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const live2dState = useSelector(selectLive2DState);
  const currentModel = useSelector(selectCurrentModel);
  const currentExpression = useSelector(selectCurrentExpression);
  const currentMotion = useSelector(selectCurrentMotion);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectLive2DError);

  // Initialize Live2D service
  const initialize = useCallback(async () => {
    try {
      await dispatch(initializeLive2D()).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to initialize Live2D:', error);
      return false;
    }
  }, [dispatch]);

  // Load character model
  const loadCharacterModel = useCallback(async (characterId: CharacterType) => {
    try {
      const result = await dispatch(loadModel({characterId})).unwrap();
      return result.model;
    } catch (error) {
      console.error('Failed to load character model:', error);
      throw error;
    }
  }, [dispatch]);

  // Change expression based on emotion
  const changeExpression = useCallback(async (emotion: EmotionState, intensity?: number) => {
    try {
      await dispatch(setExpression({emotion, intensity})).unwrap();
    } catch (error) {
      console.error('Failed to change expression:', error);
      throw error;
    }
  }, [dispatch]);

  // Play motion animation
  const playAnimation = useCallback(async (group: string, motionId?: string) => {
    try {
      const motion = await dispatch(playMotion({group, motionId})).unwrap();
      return motion;
    } catch (error) {
      console.error('Failed to play motion:', error);
      throw error;
    }
  }, [dispatch]);

  // Start lip sync with audio
  const startLipSyncWithAudio = useCallback(async (audioData: ArrayBuffer, sensitivity?: number) => {
    try {
      await dispatch(startLipSync({audioData, sensitivity})).unwrap();
    } catch (error) {
      console.error('Failed to start lip sync:', error);
      throw error;
    }
  }, [dispatch]);

  // Stop lip sync
  const stopLipSyncAnimation = useCallback(() => {
    dispatch(stopLipSync());
  }, [dispatch]);

  // Set model parameter
  const setModelParameter = useCallback((id: string, value: number) => {
    dispatch(setParameter({id, value}));
  }, [dispatch]);

  // Update viewport settings
  const updateViewportSettings = useCallback((settings: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
  }) => {
    dispatch(updateViewport(settings));
  }, [dispatch]);

  // Enable/disable auto blinking
  const toggleAutoBlinking = useCallback((enabled: boolean) => {
    dispatch(setAutoBlinking(enabled));
  }, [dispatch]);

  // Enable/disable auto breathing
  const toggleAutoBreathing = useCallback((enabled: boolean) => {
    dispatch(setAutoBreathing(enabled));
  }, [dispatch]);

  // Set eye tracking target
  const setEyeTarget = useCallback((x: number, y: number) => {
    dispatch(setEyeTrackingTarget({x, y}));
  }, [dispatch]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch(clearLive2DError());
  }, [dispatch]);

  // Dispose resources
  const dispose = useCallback(() => {
    dispatch(disposeLive2D());
  }, [dispatch]);

  // Play emotion-based animation sequence
  const playEmotionSequence = useCallback(async (emotion: EmotionState) => {
    try {
      // First set the expression
      await changeExpression(emotion);
      
      // Then play appropriate motion
      let motionGroup = 'idle';
      switch (emotion) {
        case 'happy':
          motionGroup = 'greeting';
          break;
        case 'sad':
          motionGroup = 'idle';
          break;
        case 'angry':
          motionGroup = 'gesture';
          break;
        case 'surprised':
          motionGroup = 'gesture';
          break;
        case 'embarrassed':
          motionGroup = 'idle';
          break;
        default:
          motionGroup = 'idle';
      }
      
      await playAnimation(motionGroup);
    } catch (error) {
      console.error('Failed to play emotion sequence:', error);
      throw error;
    }
  }, [changeExpression, playAnimation]);

  // Play talking animation with lip sync
  const playTalkingAnimation = useCallback(async (audioData?: ArrayBuffer) => {
    try {
      // Play talking motion
      await playAnimation('talking');
      
      // Start lip sync if audio data is provided
      if (audioData) {
        await startLipSyncWithAudio(audioData);
      }
    } catch (error) {
      console.error('Failed to play talking animation:', error);
      throw error;
    }
  }, [playAnimation, startLipSyncWithAudio]);

  // Play greeting animation
  const playGreetingAnimation = useCallback(async () => {
    try {
      await changeExpression('happy');
      await playAnimation('greeting');
    } catch (error) {
      console.error('Failed to play greeting animation:', error);
      throw error;
    }
  }, [changeExpression, playAnimation]);

  // Play idle animation
  const playIdleAnimation = useCallback(async () => {
    try {
      await changeExpression('neutral');
      await playAnimation('idle');
    } catch (error) {
      console.error('Failed to play idle animation:', error);
      throw error;
    }
  }, [changeExpression, playAnimation]);

  // Auto dispose on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    // State
    live2dState,
    currentModel,
    currentExpression,
    currentMotion,
    isLoading,
    error,
    
    // Actions
    initialize,
    loadCharacterModel,
    changeExpression,
    playAnimation,
    startLipSyncWithAudio,
    stopLipSyncAnimation,
    setModelParameter,
    updateViewportSettings,
    toggleAutoBlinking,
    toggleAutoBreathing,
    setEyeTarget,
    clearError,
    dispose,
    
    // Compound actions
    playEmotionSequence,
    playTalkingAnimation,
    playGreetingAnimation,
    playIdleAnimation,
  };
};

export default useLive2D;