import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Keyboard, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { socket } from '../../services/socket';
import { SidebarContext } from './_layout';
import { Header } from '../../components/ui/Header';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { typography, shadows, metrics } from '../../constants/theme';

interface Contact {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  hasUnread?: boolean;
}

const AVATAR_COLORS = ['#4f6ef7', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function ChatsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const router = useRouter();
  const { userId, logout } = useAuth();
  const { colors } = useAppTheme();
  const { openSidebar } = React.useContext(SidebarContext);

  const fetchContacts = async () => {
    try {
      const { data } = await api.get('/users/contacts');
      setContacts(data);
      setFiltered(data);
    } catch (err: any) {
      if (err.response?.status === 401) { logout(); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchContacts();
      socket.on('getOnlineUsers', setOnlineUsers);
      return () => { socket.off('getOnlineUsers', setOnlineUsers); };
    }, [userId])
  );

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true); 
    fetchContacts(); 
  };

  const handleSearch = (t: string) => {
    setQuery(t);
    setFiltered(
      t.trim()
        ? contacts.filter(c => c.name.toLowerCase().includes(t.toLowerCase()))
        : contacts
    );
  };

  const openChat = (contact: Contact) => {
    router.push({
      pathname: '/(main)/(chat)/[id]',
      params: { id: contact._id, name: contact.name, avatar: contact.profilePicture || '' }
    } as any);
  };

  const renderSkeleton = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={54} height={54} borderRadius={27} style={{ marginRight: 14 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Chats"
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
              <Image source={require('../../assets/images/new-logo.png')} style={styles.headerAvatar} />
            </TouchableOpacity>
            <Text style={[typography.h1, { color: colors.text }]}>Chats</Text>
          </View>
        }
        rightIcon="person-add-outline"
        onRightPress={() => router.push('/(tabs)/discover' as any)}
      />

      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, typography.body1, { color: colors.text }]}
          placeholder="Search chats…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? renderSkeleton() : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[typography.h3, { color: colors.text, marginTop: 16 }]}>No Contacts Yet</Text>
              <Text style={[typography.body2, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>Go to Discover to find and add people</Text>
              <Button title="Discover People" onPress={() => router.push('/(tabs)/discover' as any)} style={{ marginTop: 24, width: '100%' }} />
            </View>
          }
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => {
            const isOnline = onlineUsers.includes(item._id);
            return (
              <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.6}>
                <View style={styles.avatarWrap}>
                  {item.profilePicture ? (
                    <Image source={{ uri: item.profilePicture }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
                      <Text style={[typography.h3, { color: '#fff' }]}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  {isOnline && <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />}
                </View>
                <View style={styles.info}>
                  <Text style={[typography.body1, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{isOnline ? 'Active now' : item.email}</Text>
                </View>
                {item.hasUnread && <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: metrics.baseMargin, marginVertical: 12,
    borderRadius: 12, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1 },
  listContainer: { paddingBottom: 24 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 84 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7,
    borderWidth: 2,
  },
  info: { flex: 1 },
  unreadBadge: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
});
