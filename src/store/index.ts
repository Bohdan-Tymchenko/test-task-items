import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from './auth/authSlice';
import { itemsReducer } from './items/itemsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    items: itemsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export * from './auth/authSlice';