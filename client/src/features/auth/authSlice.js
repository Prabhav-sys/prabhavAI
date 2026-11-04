
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = Boolean(action.payload);
            state.loading = false;
            state.error = null;
        },

        clearCredentials: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },

        setAuthLoading: (state, action) => {
            state.loading = action.payload;
        },

        setAuthError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const {
    setCredentials,
    clearCredentials,
    setAuthLoading,
    setAuthError
} = authSlice.actions;

export default authSlice.reducer;
