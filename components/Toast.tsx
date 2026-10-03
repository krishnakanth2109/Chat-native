import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  visible: boolean;
  title: string;
  message: string;
  onPress: () => void;
  onDismiss: () => void;
}

export default function Toast({ visible, title, message, onPress, onDismiss }: ToastProps) {
  const translateY = useSharedValue(-150);
  const targetY = Platform.OS === 'ios' ? 50 : 30;

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss]);

  useAnimatedReaction(
    () => visible,
    (isVisible, wasVisible) => {
      if (isVisible === wasVisible) return;
      translateY.value = isVisible
        ? withSpring(targetY, { damping: 15, stiffness: 100 })
        : withTiming(-150, { duration: 300 });
    },
    [visible, targetY]
  );

  useEffect(() => {
    if (visible) {
      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, handleDismiss]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!visible) return null;

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={styles.toastCard} 
        activeOpacity={0.9} 
        onPress={() => { handleDismiss(); onPress(); }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={1}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Ionicons name="close" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    padding: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155', // slate-700
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6', // blue-500
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#94a3b8',
    fontSize: 14,
  },
  closeBtn: {
    padding: 4,
  }
});
