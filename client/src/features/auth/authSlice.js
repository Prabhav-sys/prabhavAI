
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

        updateCreditBalance: (state, action) => {
            if (state.user) state.user.credits = action.payload;
        },

        setAuthLoading: (state, action) => {
            state.loading = action.payload;
            if (action.payload) {
                state.error = null;
            }
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
    updateCreditBalance,
    setAuthLoading,
    setAuthError
} = authSlice.actions;

export default authSlice.reducer;
