// chat-native/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import notifee, { EventType } from '@notifee/react-native';
import { connectSocket, disconnectSocket } from '../services/socket';
import api from '../services/api'; 
import { startBackgroundService, stopBackgroundService } from '../services/BackgroundService';

interface AuthContextType {
  user: any | null;
  userId: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Handle Background / Quit State Notification Taps
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification?.data?.type === 'new_message') {
    // Note: Navigation from fully killed state requires the router to be ready, 
    // which happens after AuthContext mounts. We rely on the getInitialNotification check.
  }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLogin();

    // Check if the app was opened from a notification while killed
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification?.data?.type === 'new_message') {
        const senderId = initialNotification.notification.data.senderId as string;
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push(`/(main)/(chat)/${senderId}?name=Chat` as any);
        }, 1000);
      }
    });

  }, []);

  const checkLogin = async () => {
    try {
      let token = await SecureStore.getItemAsync('token');
      if (!token) {
        const legacyToken = await AsyncStorage.getItem('token');
        if (legacyToken) {
          await SecureStore.setItemAsync('token', legacyToken);
          await AsyncStorage.removeItem('token');
          token = legacyToken;
        }
      }
      if (token) {
        const decoded: any = jwtDecode(token);
        const uId = decoded.user?.id || decoded.id; 
        
        setUserId(uId);
        setUser(decoded.user);
        connectSocket(uId);
        
        // Start foreground service to keep socket alive
        await startBackgroundService();
      }
    } catch {
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    await SecureStore.setItemAsync('token', token);
    const decoded: any = jwtDecode(token);
    const uId = decoded.user?.id || decoded.id;

    setUserId(uId);
    setUser(decoded.user);
    connectSocket(uId);
    
    await startBackgroundService();

    router.replace('/(tabs)/contacts');
  };

  const logout = async () => {
    await stopBackgroundService();
    await Promise.all([
      SecureStore.deleteItemAsync('token'),
      AsyncStorage.removeItem('token'),
    ]);
    disconnectSocket();
    setUserId(null);
    setUser(null);
    router.replace('/(auths)/login');
  };

  return (
    <AuthContext.Provider value={{ user, userId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
