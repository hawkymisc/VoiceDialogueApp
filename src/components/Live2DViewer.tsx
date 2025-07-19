import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';
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
  handleLive2DEvent,
  selectLive2DState,
  selectCurrentModel,
  selectCurrentExpression,
  selectCurrentMotion,
  selectIsLoading,
  selectLive2DError,
} from '../store/slices/live2dSlice';
import {CharacterType} from '../types/Character';
import {EmotionState} from '../types/Dialogue';
import {Live2DEvent} from '../types/Live2D';
import {live2dService} from '../services/live2dService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface Live2DViewerProps {
  characterId: CharacterType;
  emotion?: EmotionState;
  isVisible: boolean;
  autoLoad?: boolean;
  enableInteraction?: boolean;
  enableAutoAnimation?: boolean;
  style?: any;
  onModelLoaded?: (characterId: CharacterType) => void;
  onError?: (error: string) => void;
}

export const Live2DViewer: React.FC<Live2DViewerProps> = ({
  characterId,
  emotion = 'neutral',
  isVisible,
  autoLoad = true,
  enableInteraction = true,
  enableAutoAnimation = true,
  style,
  onModelLoaded,
  onError,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const viewRef = useRef<View>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  // Redux selectors
  const live2dState = useSelector(selectLive2DState);
  const currentModel = useSelector(selectCurrentModel);
  const currentExpression = useSelector(selectCurrentExpression);
  const currentMotion = useSelector(selectCurrentMotion);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectLive2DError);

  // Initialize Live2D service
  useEffect(() => {
    if (!isInitialized && isVisible) {
      dispatch(initializeLive2D())
        .unwrap()
        .then(() => {
          setIsInitialized(true);
          setupEventListeners();
        })
        .catch((error) => {
          console.error('Failed to initialize Live2D:', error);
          onError?.(error);
        });
    }
  }, [isVisible, isInitialized, dispatch, onError]);

  // Load model when character changes
  useEffect(() => {
    if (isInitialized && isVisible && autoLoad && 
        (!currentModel || !currentModel.config.modelPath.includes(characterId))) {
      dispatch(loadModel({characterId}))
        .unwrap()
        .then(() => {
          onModelLoaded?.(characterId);
          
          // Set initial expression
          if (emotion !== 'neutral') {
            dispatch(setExpression({emotion}));
          }
          
          // Enable auto animations
          if (enableAutoAnimation) {
            dispatch(setAutoBlinking(true));
            dispatch(setAutoBreathing(true));
          }
        })
        .catch((error) => {
          console.error('Failed to load model:', error);
          onError?.(error);
        });
    }
  }, [isInitialized, isVisible, autoLoad, characterId, currentModel, emotion, enableAutoAnimation, dispatch, onModelLoaded, onError]);

  // Update expression when emotion changes
  useEffect(() => {
    if (isInitialized && currentModel && currentExpression?.emotion !== emotion) {
      dispatch(setExpression({emotion}));
    }
  }, [emotion, isInitialized, currentModel, currentExpression, dispatch]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    const handleEvent = (event: Live2DEvent) => {
      dispatch(handleLive2DEvent(event));
    };

    live2dService.addEventListener(handleEvent);
    
    return () => {
      live2dService.removeEventListener(handleEvent);
    };
  }, [dispatch]);

  // Animation loop
  useEffect(() => {
    if (isInitialized && isVisible && currentModel) {
      const animate = (timestamp: number) => {
        const deltaTime = timestamp - (animationFrame || timestamp);
        live2dService.update(deltaTime);
        live2dService.render();
        
        setAnimationFrame(requestAnimationFrame(animate));
      };
      
      setAnimationFrame(requestAnimationFrame(animate));
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        setAnimationFrame(null);
      }
    };
  }, [isInitialized, isVisible, currentModel, animationFrame]);

  // Handle touch interactions
  const handleTouch = useCallback((event: any) => {
    if (!enableInteraction || !currentModel) return;

    const now = Date.now();
    const {locationX, locationY} = event.nativeEvent;
    const timeSinceLastTouch = now - lastTouchTime;

    // Convert touch coordinates to Live2D coordinates
    const normalizedX = (locationX / screenWidth) * 2 - 1;
    const normalizedY = (locationY / screenHeight) * 2 - 1;

    // Eye tracking
    dispatch(setEyeTrackingTarget({x: normalizedX * 0.5, y: normalizedY * 0.5}));

    // Double tap detection
    if (timeSinceLastTouch < 300) {
      // Play random gesture motion
      dispatch(playMotion({group: 'gesture'}));
    } else {
      // Single tap - play talking motion
      dispatch(playMotion({group: 'talking'}));
    }

    setLastTouchTime(now);
  }, [enableInteraction, currentModel, lastTouchTime, dispatch]);

  // Handle pan gestures for viewport adjustment
  const handlePanGesture = useCallback((event: any) => {
    if (!enableInteraction) return;

    const {translationX, translationY} = event.nativeEvent;
    
    if (event.nativeEvent.state === State.ACTIVE) {
      dispatch(updateViewport({
        x: translationX,
        y: translationY,
      }));
    }
  }, [enableInteraction, dispatch]);

  // Handle pinch gestures for scaling
  const handlePinchGesture = useCallback((event: any) => {
    if (!enableInteraction) return;

    const {scale} = event.nativeEvent;
    
    if (event.nativeEvent.state === State.ACTIVE) {
      dispatch(updateViewport({
        scale: Math.max(0.5, Math.min(2.0, scale)),
      }));
    }
  }, [enableInteraction, dispatch]);

  // Play idle animation when not talking
  useEffect(() => {
    if (isInitialized && currentModel && !currentMotion && !isLoading) {
      const idleTimer = setTimeout(() => {
        dispatch(playMotion({group: 'idle'}));
      }, 3000);
      
      return () => clearTimeout(idleTimer);
    }
  }, [isInitialized, currentModel, currentMotion, isLoading, dispatch]);

  // Handle lip sync integration
  const handleLipSync = useCallback((audioData: ArrayBuffer) => {
    if (isInitialized && currentModel) {
      dispatch(startLipSync({audioData, sensitivity: 1.0}));
    }
  }, [isInitialized, currentModel, dispatch]);

  // Stop lip sync
  const handleStopLipSync = useCallback(() => {
    if (isInitialized) {
      dispatch(stopLipSync());
    }
  }, [isInitialized, dispatch]);

  // Expose methods for parent components
  React.useImperativeHandle(React.createRef(), () => ({
    playMotion: (group: string, motionId?: string) => {
      dispatch(playMotion({group, motionId}));
    },
    setExpression: (emotion: EmotionState) => {
      dispatch(setExpression({emotion}));
    },
    startLipSync: handleLipSync,
    stopLipSync: handleStopLipSync,
    setParameter: (id: string, value: number) => {
      dispatch(setParameter({id, value}));
    },
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <PinchGestureHandler onGestureEvent={handlePinchGesture}>
        <PanGestureHandler onGestureEvent={handlePanGesture}>
          <View style={styles.canvasContainer}>
            <TouchableOpacity
              style={styles.touchArea}
              onPress={handleTouch}
              activeOpacity={0.8}
              disabled={!enableInteraction}
              testID="live2d-touch-area"
              accessibilityLabel="Live2D Character Display"
              accessibilityRole="button">
              
              {/* Live2D Canvas would be rendered here */}
              <View style={styles.mockCanvas}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading {characterId}...</Text>
                  </View>
                ) : currentModel ? (
                  <View style={styles.modelContainer}>
                    <Text style={styles.modelName}>{currentModel.name}</Text>
                    <Text style={styles.expressionName}>
                      {currentExpression?.name || 'No Expression'}
                    </Text>
                    <Text style={styles.motionName}>
                      {currentMotion?.name || 'Idle'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No Model Loaded</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </PanGestureHandler>
      </PinchGestureHandler>
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Character: {characterId} | Emotion: {emotion}
          </Text>
          <Text style={styles.debugText}>
            Playing: {currentMotion?.name || 'None'}
          </Text>
          <Text style={styles.debugText}>
            Expression: {currentExpression?.name || 'None'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCanvas: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(240, 240, 240, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  modelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  expressionName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  motionName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  errorContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default Live2DViewer;