import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Animated, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CallProvider } from '../context/CallContext';
import { AppThemeProvider } from '../context/ThemeContext';
import { CallUI } from '../components/CallUI';

// Keep the native splash screen visible until we are ready to animate
SplashScreen.preventAutoHideAsync();

function AnimatedSplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Hide the native splash screen, so our Animated one takes over
    SplashScreen.hideAsync().then(() => {
      // Start the animation
      Animated.sequence([
        Animated.delay(800), // Show the logo for 0.8 seconds
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationComplete();
      });
    });
  }, [onAnimationComplete, opacity, scale]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.splashContainer, { opacity }]}>
      <Animated.Image 
        source={require('../assets/images/new-logo.png')} 
        style={[styles.logo, { transform: [{ scale }] }]} 
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const markAppReady = useCallback(() => setAppReady(true), []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <CallProvider>
              <CallUI />
              <NotificationProvider>
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auths)" />
                  <Stack.Screen name="(main)" />
                </Stack>
              </NotificationProvider>
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </AppThemeProvider>

      {!appReady && (
        <AnimatedSplashScreen onAnimationComplete={markAppReady} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it sits on top of everything
  },
  logo: {
    width: 200,
    height: 200,
  }
});
