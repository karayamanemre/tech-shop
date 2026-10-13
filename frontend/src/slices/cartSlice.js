import { createSlice } from '@reduxjs/toolkit';
import { updateCart } from '../utils/cartUtils';

const emptyCart = { cartItems: [], shippingAddress: {}, paymentMethod: 'Demo' };
let initialState = emptyCart;
try {
  const saved = JSON.parse(localStorage.getItem('techshop-cart-v2'));
  if (saved && Array.isArray(saved.cartItems))
    initialState = { ...emptyCart, ...saved };
} catch {
  localStorage.removeItem('techshop-cart-v2');
}

const cartSlice = createSlice({
  name: 'techshop-cart-v2',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;

      const existItem = state.cartItems.find((x) => x._id === item._id);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x._id === existItem._id ? item : x
        );
      } else {
        state.cartItems = [...state.cartItems, item];
      }

      return updateCart(state);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x._id !== action.payload);
      return updateCart(state);
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      return updateCart(state);
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      return updateCart(state);
    },
    clearCartItems: (state) => {
      state.cartItems = [];
      return updateCart(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  saveShippingAddress,
  savePaymentMethod,
  clearCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
