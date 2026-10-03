import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export const VoicePlayer = ({ url, isMe }: { url: string; isMe: boolean }) => {
  const player = useAudioPlayer(url, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const { colors } = useAppTheme();

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish) await player.seekTo(0);
      player.play();
    }
  };
  const duration = status.duration * 1000;
  const position = status.currentTime * 1000;
  const progress = duration > 0 ? position / duration : 0;
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, paddingVertical: 2 }}>
      <TouchableOpacity onPress={handlePlayPause} style={{ backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 8 }}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color={isMe ? '#fff' : colors.primary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, backgroundColor: isMe ? 'rgba(255,255,255,0.3)' : colors.border, borderRadius: 2 }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: isMe ? '#fff' : colors.primary, borderRadius: 2 }} />
        </View>
        <Text style={[typography.caption, { color: isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary, marginTop: 4 }]}>{fmt(position)} / {fmt(duration)}</Text>
      </View>
      <Ionicons name="mic" size={14} color={isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
    </View>
  );
};
