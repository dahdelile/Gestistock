// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

// ✅ Slice pour l'interface utilisateur
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarShow: true,
    theme: 'light'
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarShow = !state.sidebarShow;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setUi: (state, action) => {
      return { ...state, ...action.payload };
    }
  }
});

// ✅ Slice pour l'authentification
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    reset: (state) => {
      return { user: null, isAuthenticated: false, loading: false, error: null };
    }
  }
});

// ✅ Export des actions
export const { toggleSidebar, setTheme, setUi } = uiSlice.actions;
export const { setUser, logout, setLoading, setError, reset } = authSlice.actions;

// ✅ Création du store
const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authSlice.reducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;