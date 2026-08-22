import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  // Set when user picks from manual selection (districtId/areaId from DB)
  districtId: string | null;
  districtName: string | null;
  areaId: string | null;
  areaName: string | null;

  // Always set when GPS detects location (raw coordinates + reverse-geocoded name)
  latitude: number | null;
  longitude: number | null;
  displayName: string | null; // e.g. "Perundurai, Erode" from reverse geocode

  isHydrated: boolean;
  locationResolved: boolean;
  showLocationModal: boolean;
}

const initialState: LocationState = {
  districtId: null,
  districtName: null,
  areaId: null,
  areaName: null,
  latitude: null,
  longitude: null,
  displayName: null,
  isHydrated: false,
  locationResolved: false,
  showLocationModal: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Used for manual selection (district + area from DB)
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
      state.displayName = `${action.payload.areaName}, ${action.payload.districtName}`;
      state.locationResolved = true;
    },

    // Used for GPS-detected location (coordinates + display name only, no DB IDs needed)
    setGPSLocation(
      state,
      action: PayloadAction<{
        latitude: number;
        longitude: number;
        displayName: string;
      }>,
    ) {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.displayName = action.payload.displayName;
      // Clear any old manual selection
      state.districtId = null;
      state.districtName = null;
      state.areaId = null;
      state.areaName = null;
      state.locationResolved = true;
    },

    clearLocation(state) {
      state.districtId = null;
      state.districtName = null;
      state.areaId = null;
      state.areaName = null;
      state.latitude = null;
      state.longitude = null;
      state.displayName = null;
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

export const {
  setLocation,
  setGPSLocation,
  clearLocation,
  setHydrated,
  setLocationResolved,
  setShowLocationModal,
} = locationSlice.actions;
export default locationSlice.reducer;
