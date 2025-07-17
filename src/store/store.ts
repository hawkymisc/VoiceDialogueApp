import {configureStore} from '@reduxjs/toolkit';
import {characterSlice} from './slices/characterSlice';
import {dialogueSlice} from './slices/dialogueSlice';
import {userSlice} from './slices/userSlice';
import {audioSlice} from './slices/audioSlice';

export const store = configureStore({
  reducer: {
    character: characterSlice.reducer,
    dialogue: dialogueSlice.reducer,
    user: userSlice.reducer,
    audio: audioSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
