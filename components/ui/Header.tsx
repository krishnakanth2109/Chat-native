import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';
import { typography, shadows } from '../../constants/theme';
import { Image } from 'expo-image';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  elevated?: boolean;
  leftComponent?: React.ReactNode;
}

export function Header({ title, showBack, rightIcon, onRightPress, avatarUrl, onAvatarPress, elevated, leftComponent }: HeaderProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <View style={[
      styles.header, 
      { backgroundColor: colors.headerBackground, borderBottomColor: colors.border },
      elevated && shadows.sm,
      elevated && { borderBottomWidth: 0 }
    ]}>
      <View style={styles.left}>
        {leftComponent ? (
          leftComponent
        ) : (
          <>
            {showBack && (
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.headerIcon} />
              </TouchableOpacity>
            )}
            {avatarUrl && (
              <TouchableOpacity onPress={onAvatarPress} style={{ marginRight: 12 }}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </TouchableOpacity>
            )}
            <Text style={[typography.h2, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          </>
        )}
      </View>
      
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
          <Ionicons name={rightIcon} size={24} color={colors.headerIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52,
    paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBtn: { padding: 4, marginRight: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
});
