import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../lib/axios";
import { toast } from "sonner";

import type {
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  VerifyEmailPayload,
  UserProfile,
  LoginResponse,
} from "../../types/auth";

// Helper function to extract error message
const extractErrorMessage = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.non_field_errors) return data.non_field_errors[0];
    
    if (typeof data === 'object') {
      const firstField = Object.keys(data)[0];
      if (firstField && Array.isArray(data[firstField])) {
        return `${firstField}: ${data[firstField][0]}`;
      }
      if (firstField && typeof data[firstField] === 'string') {
        return `${firstField}: ${data[firstField]}`;
      }
    }
  }
  
  if (error.message === 'Network Error') {
    return 'Network connection error. Please check your internet.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};


export const login = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: any }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Login attempt:', payload.email);
    const res = await api.post<LoginResponse>("/accounts/login/", payload);
    console.log(' Login successful');
    
    // toast.success('Login successful!', {
    //   duration: 3000,
    //   position: 'top-center',
    // });
    
    return res.data;
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Login failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const register = createAsyncThunk<
  any,
  RegisterPayload,
  { rejectValue: any }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    console.log('Registration attempt:', payload.email);
    const res = await api.post("/accounts/register/", payload);
    console.log(' Registration successful');
    
    toast.success('Registration successful! Please verify your email.', {
      duration: 5000,
      position: 'top-center',
    });
    
    return res.data;
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Registration failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});

// ==================== LOGOUT ====================
export const logout = createAsyncThunk<
  boolean,
  void,
  { rejectValue: any }
>("auth/logout", async (_, { rejectWithValue: _rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      toast.info('You are already logged out.', {
        duration: 3000,
        position: 'top-center',
      });
      return true;
    }

    await api.post(
      "/accounts/logout/",
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(' Logout successful');
    
    // toast.success('Logged out successfully!', {
    //   duration: 3000,
    //   position: 'top-center',
    // });
    
    return true;
  } catch (err: any) {
    console.log(' Logout error:', extractErrorMessage(err));
    
    toast.info('You have been logged out locally.', {
      duration: 3000,
      position: 'top-center',
    });
    
    return true;
  }
});


export const fetchProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: any }
>("auth/profile", async (_, { rejectWithValue }) => {
  try {
    console.log(' Fetching profile...');
    const res = await api.get<UserProfile>("/accounts/profile/");
    console.log('Profile fetched:', res.data.email);
    return res.data;
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Profile fetch failed:', errorMessage);
    
    if (err.response?.status !== 401) {
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    }
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const changePassword = createAsyncThunk<
  { message: string },
  ChangePasswordPayload,
  { rejectValue: any }
>("auth/change-password", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Changing password...');
    await api.post("/accounts/change-password/", payload);
    console.log(' Password changed');
    
    toast.success('Password changed successfully!', {
      duration: 4000,
      position: 'top-center',
    });
    
    return { message: 'Password changed successfully' };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Password change failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const forgotPassword = createAsyncThunk<
  { message: string, email: string },
  { email: string },
  { rejectValue: any }
>("auth/forgot-password", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Forgot password request for:', payload.email);
    await api.post("/accounts/password-reset/", {
      email: payload.email,
    });
    console.log(' Reset email sent');
    
    toast.success('Password reset email sent! Check your inbox.', {
      duration: 5000,
      position: 'top-center',
    });
    
    return { 
      message: 'Reset email sent', 
      email: payload.email 
    };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Forgot password failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const resetPasswordConfirm = createAsyncThunk<
  { message: string },
  { email: string; otp: string; password: string },
  { rejectValue: any }
>("auth/reset-password-confirm", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Resetting password...');
    
    await api.post("/accounts/password-reset-confirm/", {
      email: payload.email,
      otp: payload.otp,
      new_password: payload.password
    });
    
    console.log(' Password reset successful');
    
    toast.success('Password reset successful! You can now login.', {
      duration: 5000,
      position: 'top-center',
    });
    
    return { message: 'Password reset successful' };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Password reset failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const verifyEmail = createAsyncThunk<
  { message: string },
  VerifyEmailPayload,
  { rejectValue: any }
>("auth/verify-email", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Verifying email:', payload.email);
    await api.post("/accounts/verify-email/", {
      email: payload.email,
      otp: payload.otp,
    });

    console.log(' Email verified');
    
    toast.success('Email verified successfully!', {
      duration: 4000,
      position: 'top-center',
    });
    
    return { message: 'Email verified' };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Email verification failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const checkOTP = createAsyncThunk<
  { message: string, verified: boolean },
  VerifyEmailPayload,
  { rejectValue: any }
>("auth/check-otp", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Checking OTP for:', payload.email);
    await api.post("/accounts/check-otp/", {
      email: payload.email,
      otp: payload.otp,
    });

    console.log(' OTP verified');
    
    toast.success('OTP verified successfully!', {
      duration: 3000,
      position: 'top-center',
    });
    
    return { 
      message: 'OTP verified', 
      verified: true 
    };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' OTP check failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      verified: false,
      status: err.response?.status 
    });
  }
});


export const resendOtp = createAsyncThunk<
  { message: string },
  { email: string },
  { rejectValue: any }
>("auth/resend-otp", async (payload, { rejectWithValue }) => {
  try {
    console.log(' Resending OTP to:', payload.email);
    await api.post("/accounts/resend-otp/", {
      email: payload.email,
    });
    
    console.log(' OTP resent');
    
    toast.success('New verification code sent!', {
      duration: 4000,
      position: 'top-center',
    });
    
    return { message: 'OTP resent' };
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Resend OTP failed:', errorMessage);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});


export const refreshToken = createAsyncThunk<
  { access: string; refresh: string },
  void,
  { rejectValue: any }
>("auth/refresh-token", async (_, { rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      console.log(' No refresh token available');
      return rejectWithValue({ 
        error: "No refresh token available" 
      });
    }

    console.log(' Attempting to refresh token...');

    // Use raw axios (no interceptors) to avoid attaching expired access tokens
    // or triggering the 401 retry loop on the refresh endpoint itself
    const response = await axios.post<{ access: string; refresh: string }>(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/accounts/token/refresh/`,
      { refresh: refreshToken },
      { headers: { "Content-Type": "application/json", "X-Auth-Mode": "cookie" }, withCredentials: true }
    );

    console.log(' Token refreshed successfully');

    localStorage.setItem("accessToken", response.data.access);
    if (response.data.refresh) {
      localStorage.setItem("refreshToken", response.data.refresh);
    }
    
    // Optional: Show toast only in development
    // if (import.meta.env.DEV) {
    //   toast.success('Token refreshed!', {
    //     duration: 2000,
    //     position: 'top-center',
    //   });
    // }
    
    return response.data;
  } catch (err: any) {
    const errorMessage = extractErrorMessage(err);
    console.log(' Token refresh failed:', errorMessage);
    
    // Clear invalid tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    // Show error toast
    toast.error('Session expired. Please login again.', {
      duration: 5000,
      position: 'top-center',
      action: {
        label: 'Login',
        onClick: () => window.location.href = '/auth/signIn'
      }
    });
    
    return rejectWithValue({ 
      error: errorMessage,
      status: err.response?.status 
    });
  }
});