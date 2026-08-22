import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CustomerProfile } from '@/types/customer';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CustomerProfile | null;
  isHydrated: boolean;
  showLoginModal: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  showLoginModal: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setUser(state, action: PayloadAction<CustomerProfile | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setShowLoginModal(state, action: PayloadAction<boolean>) {
      state.showLoginModal = action.payload;
    },
  },
});

export const { setTokens, setUser, clearAuth, setHydrated, setShowLoginModal } = authSlice.actions;
export default authSlice.reducer;
