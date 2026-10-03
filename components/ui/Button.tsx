import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { typography, metrics, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle }: ButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBgColor = () => {
    if (disabled) return colors.border;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.surfaceSecondary;
    if (variant === 'danger') return colors.error;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    if (variant === 'primary' || variant === 'danger') return '#ffffff';
    if (variant === 'secondary') return colors.text;
    if (variant === 'outline') return colors.primary;
    return colors.text;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={handlePress}
      style={[
        styles.button,
        { backgroundColor: getBgColor() },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.primary },
        (variant === 'primary' && !disabled) && shadows.sm,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[typography.button, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: metrics.buttonHeight,
    borderRadius: metrics.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: metrics.largePadding,
    flexDirection: 'row',
  },
});
