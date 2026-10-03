import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { typography, shadows } from '../../constants/theme';
import { VoicePlayer } from './VoicePlayer';
import { Message } from './types';

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const Bubble = React.memo(function Bubble({ item, isMe }: { item: Message; isMe: boolean }) {
  const { colors } = useAppTheme();
  const b = React.useMemo(() => getBubbleStyles(colors), [colors]);

  if (item.messageType === 'emoji' || item.messageType === 'sticker') {
    return (
      <View style={[b.wrap, isMe ? b.myWrap : b.theirWrap]}>
        <Text style={{ fontSize: item.messageType === 'sticker' ? 56 : 42 }}>{item.content}</Text>
        <Text style={[b.emojiTime, { textAlign: isMe ? 'right' : 'left' }]}>{fmtTime(item.createdAt)}</Text>
      </View>
    );
  }
  
  if (item.messageType === 'image') {
    return (
      <View style={[b.wrap, isMe ? b.myWrap : b.theirWrap]}>
        <View style={b.imgWrap}>
          {item.fileUrl ? <Image source={{ uri: item.fileUrl }} style={b.img} contentFit="cover" /> : (
            <View style={[b.img, b.imgFallback]}><Ionicons name="image-outline" size={36} color={colors.textSecondary} /></View>
          )}
          <View style={b.imgTimeWrap}>
            <Text style={b.imgTimeTxt}>{fmtTime(item.createdAt)}</Text>
            {isMe && <Ionicons name={item.status === 'pending' ? 'time-outline' : item.status === 'error' ? 'alert-circle' : 'checkmark-done'} size={12} color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[b.wrap, isMe ? b.myWrap : b.theirWrap]}>
      <View style={[b.bubble, { backgroundColor: isMe ? colors.bubbleMe : colors.bubbleThem }]}>
        {item.messageType === 'text' && <Text style={[typography.body1, { color: isMe ? colors.bubbleTextMe : colors.bubbleTextThem }]}>{item.content}</Text>}
        
        {item.messageType === 'document' && (
          <TouchableOpacity style={b.docCard} onPress={() => item.fileUrl && Linking.openURL(item.fileUrl)} activeOpacity={0.7}>
            <View style={[b.docIcon, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.primaryAlpha }]}>
              <Ionicons name="document-text" size={24} color={isMe ? '#fff' : colors.primary} />
            </View>
            <Text style={[typography.body2, { color: isMe ? colors.bubbleTextMe : colors.bubbleTextThem, flex: 1 }]} numberOfLines={2}>{item.fileName || 'Document'}</Text>
            <Ionicons name="download-outline" size={18} color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary} />
          </TouchableOpacity>
        )}
        
        {item.messageType === 'location' && item.location && (
          <TouchableOpacity style={b.locCard} onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.location!.lat},${item.location!.lng}`)} activeOpacity={0.7}>
            <View style={[b.locIconWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="location" size={22} color={isMe ? '#fff' : colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body2, { color: isMe ? colors.bubbleTextMe : colors.bubbleTextThem, fontWeight: '700' }]}>📍 Location Shared</Text>
              <Text style={[typography.caption, { color: isMe ? 'rgba(255,255,255,0.9)' : colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
                {item.location.address || `${item.location.lat.toFixed(5)}, ${item.location.lng.toFixed(5)}`}
              </Text>
              <Text style={[typography.caption, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textSecondary, marginTop: 4, fontSize: 10 }]}>Tap to open in Maps</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'voice' && item.fileUrl && <VoicePlayer url={item.fileUrl} isMe={isMe} />}
        
        <View style={b.timeWrap}>
          <Text style={[typography.caption, { fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{fmtTime(item.createdAt)}</Text>
          {isMe && <Ionicons name={item.status === 'pending' ? 'time-outline' : item.status === 'error' ? 'alert-circle' : 'checkmark-done'} size={14} color={item.status === 'error' ? colors.warning : 'rgba(255,255,255,0.7)'} style={{ marginLeft: 4 }} />}
        </View>
      </View>
    </View>
  );
});

const getBubbleStyles = (colors: any) => StyleSheet.create({
  wrap: { marginVertical: 3, paddingHorizontal: 16 },
  myWrap: { alignItems: 'flex-end' }, 
  theirWrap: { alignItems: 'flex-start' },
  emojiTime: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: '500' },
  bubble: { 
    maxWidth: '82%', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, 
    ...shadows.sm
  },
  timeWrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 6 },
  imgWrap: { position: 'relative', maxWidth: '82%', borderRadius: 22, overflow: 'hidden', ...shadows.sm },
  img: { width: 240, height: 320, borderRadius: 22 },
  imgFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary },
  imgTimeWrap: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  imgTimeTxt: { color: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: '600' },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 200, paddingVertical: 4 },
  docIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  locCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minWidth: 220, paddingVertical: 4 },
  locIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
});
