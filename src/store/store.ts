import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

import salaryReducer from './slices/salarySlice';
import { apiSlice } from './apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    salary: salaryReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
