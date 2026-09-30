import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { errorMessage } from "../api.js";
import { getToken, saveToken } from "../utils/session.js";

export const restoreSession = createAsyncThunk("auth/restore", async (_, { rejectWithValue }) => {
  if (!getToken()) return null;
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (error) {
    return rejectWithValue(errorMessage(error, "Could not verify your session. Please sign in again."));
  }
});

export const loginUser = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    saveToken(data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(errorMessage(error, "Could not sign in. Please try again."));
  }
});

export const registerUser = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/auth/register", payload);
  } catch (error) {
    return rejectWithValue(errorMessage(error, "Could not create your account."));
  }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put("/auth/me/avatar", payload);
    return data.user;
  } catch (error) {
    return rejectWithValue(errorMessage(error, "Could not update your profile."));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, loading: false, initializing: true, requestId: null },
  reducers: {
    clearSession(state) {
      state.user = null;
      state.loading = false;
      state.initializing = false;
      state.requestId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state, action) => {
        state.initializing = true;
        state.requestId = action.meta.requestId;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.user = action.payload;
        state.initializing = false;
        state.requestId = null;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.user = null;
        state.initializing = false;
        state.requestId = null;
      })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.requestId = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload; state.loading = false; state.initializing = false; })
      .addCase(loginUser.rejected, (state) => { state.loading = false; })
      .addCase(registerUser.pending, (state) => { state.loading = true; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; })
      .addCase(registerUser.rejected, (state) => { state.loading = false; })
      .addCase(updateProfile.pending, (state) => { state.loading = true; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initializing = false;
      })
      .addCase(updateProfile.rejected, (state) => { state.loading = false; });
  }
});

export const { clearSession } = authSlice.actions;
export default authSlice.reducer;
