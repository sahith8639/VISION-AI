import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null;
  token: string | null;
  role: 'student' | 'teacher' | 'admin' | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any, token: string, role: any }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
