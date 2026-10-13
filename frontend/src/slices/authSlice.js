import { createSlice } from '@reduxjs/toolkit';

const initialState = { userInfo: null };
// Session is restored from the server, never from an untrusted local role flag.

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem('userInfo');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;
