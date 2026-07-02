import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  districtId: string | null;
  districtName: string | null;
  areaId: string | null;
  areaName: string | null;
  isHydrated: boolean;
}

const initialState: LocationState = {
  districtId: null,
  districtName: null,
  areaId: null,
  areaName: null,
  isHydrated: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation(
      state,
      action: PayloadAction<{
        districtId: string;
        districtName: string;
        areaId: string;
        areaName: string;
      }>,
    ) {
      state.districtId = action.payload.districtId;
      state.districtName = action.payload.districtName;
      state.areaId = action.payload.areaId;
      state.areaName = action.payload.areaName;
    },
    clearLocation(state) {
      state.districtId = null;
      state.districtName = null;
      state.areaId = null;
      state.areaName = null;
    },
    setLocationHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
  },
});

export const { setLocation, clearLocation, setLocationHydrated } = locationSlice.actions;
export default locationSlice.reducer;
