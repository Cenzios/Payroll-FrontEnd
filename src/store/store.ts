import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

import salaryReducer from './slices/salarySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    salary: salaryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
