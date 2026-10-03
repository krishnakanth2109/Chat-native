import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Keyboard, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useAppTheme } from '../../context/ThemeContext';
import { typography, shadows } from '../../constants/theme';
import { EmojiPicker } from './EmojiPicker';
import * as Haptics from 'expo-haptics';

interface ChatInputBarProps {
  onSend: (t: string) => void;
  onSendEmoji: (e: string) => void;
  onSendSticker: (s: string) => void;
  sending: boolean;
  showAttach: boolean;
  setShowAttach: React.Dispatch<React.SetStateAction<boolean>>;
  pickImage: (cam: boolean) => void;
  sendLocation: () => void;
  sendVoiceMessage: (uri: string) => void;
}

export const ChatInputBar = React.memo(({
  onSend, onSendEmoji, onSendSticker, sending, showAttach, setShowAttach, pickImage, sendLocation, sendVoiceMessage,
}: ChatInputBarProps) => {
  const [text, setText] = useState('');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const { colors } = useAppTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(text.trim());
    setText('');
    setShowAttach(false);
    setShowEmoji(false);
  };

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch { }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recorder.stop();
      const uri = recorder.uri;
      setRecording(false);
      if (uri) sendVoiceMessage(uri);
    } catch { }
  };

  const toggleEmoji = () => {
    if (showEmoji) {
      setShowEmoji(false);
    } else {
      Keyboard.dismiss();
      setShowAttach(false);
      setShowEmoji(true);
    }
  };

  return (
    <View style={{ backgroundColor: colors.surface }}>
      {showAttach && (
        <View style={s.attachTray}>
          {[
            { icon: 'camera', label: 'Camera', color: '#6366f1', action: () => pickImage(true) },
            { icon: 'images', label: 'Gallery', color: '#0ea5e9', action: () => pickImage(false) },
            { icon: 'location', label: 'Location', color: '#ef4444', action: sendLocation },
          ].map(btn => (
            <TouchableOpacity key={btn.label} style={s.attachItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); btn.action(); }}>
              <View style={[s.attachIcon, { backgroundColor: btn.color }]}>
                <Ionicons name={btn.icon as any} size={24} color="#fff" />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '500' }]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.inputBar}>
        <TouchableOpacity onPress={toggleEmoji} style={s.addBtn}>
          <Text style={{ fontSize: 26 }}>{showEmoji ? '⌨️' : '😊'}</Text>
        </TouchableOpacity>
        
        <View style={s.inputPill}>
          <TextInput 
            style={s.input} 
            value={text} 
            onChangeText={setText} 
            placeholder="Message…" 
            placeholderTextColor={colors.textSecondary} 
            multiline 
            maxLength={1000}
            onFocus={() => { setShowAttach(false); setShowEmoji(false); }} 
          />
          {text.trim() ? (
            sending ? <ActivityIndicator size="small" color={colors.primary} style={{ paddingHorizontal: 12 }} /> : (
              <TouchableOpacity onPress={handleSend} style={s.sendBtn} activeOpacity={0.7}>
                <View style={[s.sendBtnInner, { backgroundColor: colors.primary }]}>
                  <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            )
          ) : (
            <View style={s.rightIcons}>
              <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} style={[s.iconBtn, recording && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name={recording ? 'radio-button-on' : 'mic-outline'} size={24} color={recording ? colors.error : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAttach(v => !v); setShowEmoji(false); }} style={s.iconBtn}>
                <Ionicons name="attach-outline" size={24} color={colors.textSecondary} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {showEmoji && <EmojiPicker onSelectEmoji={(e) => setText(prev => prev + e)} onSelectSticker={(s) => { onSendSticker(s); setShowEmoji(false); }} />}
    </View>
  );
});

ChatInputBar.displayName = 'ChatInputBar';

const getStyles = (colors: any) => StyleSheet.create({
  attachTray: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, paddingVertical: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  attachItem: { alignItems: 'center', gap: 8 },
  attachIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 10 },
  addBtn: { paddingBottom: 6, justifyContent: 'center' },
  inputPill: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surfaceSecondary, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, minHeight: 48 },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 120, fontFamily: 'Inter_400Regular' },
  sendBtn: { justifyContent: 'center', alignItems: 'center', paddingBottom: 2 },
  sendBtnInner: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  rightIcons: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4, gap: 4 },
  iconBtn: { padding: 6, borderRadius: 20 },
});
