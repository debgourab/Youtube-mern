// Compatibility hook: authentication now has one source of truth in Redux.
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearSession, loginUser, registerUser, updateProfile } from "../store/authSlice.js";
import { videosApi } from "../store/videosApi.js";
import { saveToken } from "../utils/session.js";

export function useAuth() {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.auth);
  const login = useCallback((payload) => dispatch(loginUser(payload)).unwrap(), [dispatch]);
  const register = useCallback((payload) => dispatch(registerUser(payload)).unwrap(), [dispatch]);
  const saveProfile = useCallback((payload) => dispatch(updateProfile(payload)).unwrap(), [dispatch]);
  const logout = useCallback(() => {
    saveToken("");
    dispatch(clearSession());
    dispatch(videosApi.util.resetApiState());
  }, [dispatch]);
  return { ...state, login, register, updateProfile: saveProfile, logout };
}
