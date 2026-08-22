import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  districtId: string | null;
  districtName: string | null;
  areaId: string | null;
  areaName: string | null;
  latitude: number | null;
  longitude: number | null;
  isHydrated: boolean;
  locationResolved: boolean; // true once GPS check is done (success or fail)
  showLocationModal: boolean;
}

const initialState: LocationState = {
  districtId: null,
  districtName: null,
  areaId: null,
  areaName: null,
  latitude: null,
  longitude: null,
  isHydrated: false,
  locationResolved: false,
  showLocationModal: false,
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
        latitude?: number | null;
        longitude?: number | null;
      }>,
    ) {
      state.districtId = action.payload.districtId;
      state.districtName = action.payload.districtName;
      state.areaId = action.payload.areaId;
      state.areaName = action.payload.areaName;
      state.latitude = action.payload.latitude ?? null;
      state.longitude = action.payload.longitude ?? null;
      state.locationResolved = true;
    },
    clearLocation(state) {
      state.districtId = null;
      state.districtName = null;
      state.areaId = null;
      state.areaName = null;
      state.latitude = null;
      state.longitude = null;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setLocationResolved(state, action: PayloadAction<boolean>) {
      state.locationResolved = action.payload;
    },
    setShowLocationModal(state, action: PayloadAction<boolean>) {
      state.showLocationModal = action.payload;
    },
  },
});

export const { setLocation, clearLocation, setHydrated, setLocationResolved, setShowLocationModal } = locationSlice.actions;
export default locationSlice.reducer;
