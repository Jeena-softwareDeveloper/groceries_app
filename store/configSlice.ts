import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppSettings } from '../api/config.api';

interface ConfigState {
  appSettings: AppSettings | null;
}

const initialState: ConfigState = {
  appSettings: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setAppSettings: (state, action: PayloadAction<AppSettings>) => {
      state.appSettings = action.payload;
    },
  },
});

export const { setAppSettings } = configSlice.actions;
export default configSlice.reducer;
