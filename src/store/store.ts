import {configureStore} from '@reduxjs/toolkit';
import {characterSlice} from './slices/characterSlice';
import {dialogueSlice} from './slices/dialogueSlice';
import {userSlice} from './slices/userSlice';
import {audioSlice} from './slices/audioSlice';
import voiceSlice from './slices/voiceSlice';
import live2dSlice from './slices/live2dSlice';

export const store = configureStore({
  reducer: {
    character: characterSlice.reducer,
    dialogue: dialogueSlice.reducer,
    user: userSlice.reducer,
    audio: audioSlice.reducer,
    voice: voiceSlice,
    live2d: live2dSlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'live2d/loadModel/fulfilled',
          'live2d/setExpression/fulfilled',
          'user/updatePreferences',
          'user/updateUserProfile/fulfilled',
          'user/updateUserPreferences/fulfilled',
        ],
        ignoredPaths: [
          'live2d.currentModel',
          'user.profile.createdAt',
          'user.profile.lastLoginAt',
          'user.profile.statistics.lastActiveDate',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
