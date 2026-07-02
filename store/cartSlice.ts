import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  itemCount: number;
}

const initialState: CartState = {
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setItemCount(state, action: PayloadAction<number>) {
      state.itemCount = action.payload;
    },
  },
});

export const { setItemCount } = cartSlice.actions;
export default cartSlice.reducer;
