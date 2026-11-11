import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  getCurrentUser,
  login as loginApi,
  LoginUser,
} from '../services/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthContextType {
  user: LoginUser | null;
  isLoading: boolean;
  login: (
    employeeId: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

// ------------------------------------
// Storage helpers
// ------------------------------------

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

async function setStorageItem(
  key: string,
  value: string
) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStorageItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

// ------------------------------------
// Auth Provider
// ------------------------------------

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<LoginUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token =
        await getStorageItem(TOKEN_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      const response =
        await getCurrentUser();

      setUser(response.user);

      await setStorageItem(
        USER_KEY,
        JSON.stringify(response.user)
      );
    } catch {
      await deleteStorageItem(TOKEN_KEY);
      await deleteStorageItem(USER_KEY);

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(
    employeeId: string,
    password: string
  ) {
    const response =
      await loginApi(
        employeeId,
        password
      );

    await setStorageItem(
      TOKEN_KEY,
      response.access_token
    );

    await setStorageItem(
      USER_KEY,
      JSON.stringify(response.user)
    );

    setUser(response.user);
  }

  async function logout() {
    await deleteStorageItem(TOKEN_KEY);
    await deleteStorageItem(USER_KEY);

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------
// useAuth hook
// ------------------------------------

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}