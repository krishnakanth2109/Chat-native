import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

export const EMOJI_CATEGORIES = [
  { label: 'Smileys', icon: '😀', emojis: ['😀','😂','😍','🥰','😎','🤩','😭','😅','🤣','😊','🙃','😏','😒','😢','😤','😠','🥺','😳','🤯','😴','🥳','😷','🤒','🤓','🧐','🤗','😇','🤭','🫠','🥹'] },
  { label: 'Gestures', icon: '👋', emojis: ['👋','🤚','✋','🖐','👌','✌️','🤞','🤟','🤙','👍','👎','👏','🙌','🫶','🤝','🙏','✍️','💪','🦾','☝️','👉','👈','👆','👇','🤘','🫵'] },
  { label: 'Hearts', icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💘','💝','💟','❣️','💔','🫀','♥️','💋'] },
  { label: 'Animals', icon: '🐶', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🦋','🐝','🐛','🦎','🐍','🐢','🦕'] },
  { label: 'Food', icon: '🍕', emojis: ['🍕','🍔','🍟','🌮','🌯','🥗','🍣','🍜','🍝','🍛','🥘','🍲','🧆','🥙','🥪','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍱','🍤','🍙','🍚','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭'] },
  { label: 'Sports', icon: '⚽', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🎯','⛳','🏹','🎣','🤿','🎽','🛹','🛷','🥌','⛸','🏋️','🤸','🤺','🏌️','🧘','🏄','🧗'] },
];

export const STICKERS = [
  '🎉','🎊','🥳','🎈','🎁','🏆','🌟','✨','💫','⭐','🌈','🌸','🌺','🌻','🌹',
  '🦄','🐉','🦋','🦕','🌙','☀️','🌊','🔥','❄️','⚡','💥','🎵','🎶','🎸','🎺',
  '🍀','🌴','🌵','🎋','🍁','🦚','🦜','🦢','🦩','🦁','🐯','🐻','🐼','🐨','🐸',
];

const MemoizedEmojiPicker = React.memo(({ onSelectEmoji, onSelectSticker }: { onSelectEmoji: (e: string) => void; onSelectSticker: (s: string) => void; }) => {
  const [tab, setTab] = React.useState<'emoji' | 'sticker'>('emoji');
  const [catIdx, setCatIdx] = React.useState(0);
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
      <View style={{ flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
        {(['emoji', 'sticker'] as const).map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }} 
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: tab === t ? colors.primary : 'transparent' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? colors.primary : colors.textSecondary }}>
              {t === 'emoji' ? '😀  Emojis' : '✨  Stickers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'emoji' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCatIdx(i); }} 
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: catIdx === i ? colors.primary : colors.surfaceSecondary }}
              >
                <Text style={{ fontSize: 12, color: catIdx === i ? '#fff' : colors.textSecondary, fontWeight: '600' }}>{cat.icon} {cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList 
            data={EMOJI_CATEGORIES[catIdx].emojis} 
            keyExtractor={(item, i) => item + i} 
            numColumns={8} 
            style={{ maxHeight: 180 }} 
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectEmoji(item); }} style={{ flex: 1, alignItems: 'center', padding: 8 }}>
                <Text style={{ fontSize: 26 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <FlatList 
          data={STICKERS} 
          keyExtractor={(item, i) => item + i} 
          numColumns={7} 
          style={{ maxHeight: 220 }} 
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectSticker(item); }} style={{ flex: 1, alignItems: 'center', padding: 8 }}>
              <Text style={{ fontSize: 38 }}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
});

MemoizedEmojiPicker.displayName = 'EmojiPicker';
export const EmojiPicker = MemoizedEmojiPicker;
