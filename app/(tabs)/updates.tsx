import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../services/socket';
import { useAppTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Skeleton } from '../../components/ui/Skeleton';
import { typography, shadows, metrics } from '../../constants/theme';
import { SidebarContext } from './_layout';
import * as Haptics from 'expo-haptics';

interface Contact {
  _id: string;
  name: string;
  profilePicture?: string;
}

const COLORS = ['#4f6ef7', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b'];
const getColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function UpdatesScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const { userId, logout } = useAuth();
  const { colors } = useAppTheme();
  const { openSidebar } = React.useContext(SidebarContext);

  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const fetchData = async () => {
    try {
      const [profileRes, contactsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/contacts'),
      ]);
      setMyProfile(profileRes.data);
      setContacts(contactsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) { logout(); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      socket.on('getOnlineUsers', setOnlineUsers);
      return () => socket.off('getOnlineUsers', setOnlineUsers);
    }, [userId])
  );

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchData();
  };

  const renderStoryRing = (item: Contact) => {
    const isOnline = onlineUsers.includes(item._id);
    return (
      <TouchableOpacity 
        style={styles.storyItem} 
        key={item._id}
        activeOpacity={0.7}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={[styles.storyRing, { borderColor: isOnline ? colors.success : colors.primary }]}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.storyAvatar} />
          ) : (
            <View style={[styles.storyAvatar, { backgroundColor: getColor(item.name) }]}>
              <Text style={[typography.h3, { color: '#fff' }]}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        {isOnline && <View style={[styles.storyOnlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6, textAlign: 'center' }]} numberOfLines={1}>
          {item.name.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ flex: 1 }}>
      <View style={{ marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
        <Skeleton width="100%" height={80} borderRadius={12} />
      </View>
      <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
        <Skeleton width={100} height={16} />
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 16 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} width={62} height={62} borderRadius={31} />)}
        </View>
      </View>
      <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
        <Skeleton width={120} height={16} />
        {[1,2,3].map(i => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 16, alignItems: 'center' }}>
            <Skeleton width={54} height={54} borderRadius={27} style={{ marginRight: 16 }} />
            <View style={{ gap: 8 }}>
              <Skeleton width={150} height={16} />
              <Skeleton width={100} height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Updates"
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
              <Image source={require('../../assets/images/new-logo.png')} style={styles.headerAvatar} />
            </TouchableOpacity>
            <Text style={[typography.h1, { color: colors.text }]}>Updates</Text>
          </View>
        }
        rightIcon="ellipsis-horizontal"
        elevated
      />

      {loading ? renderSkeleton() : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              {/* My Status */}
              <View style={styles.section}>
                <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>My Status</Text>
                <TouchableOpacity style={[styles.myStatusRow, { backgroundColor: colors.surface, ...shadows.sm }]} activeOpacity={0.8} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <Animated.View style={{ transform: [{ scale: pulse }] }}>
                    <LinearGradient colors={[colors.primary, '#7c3aed']} style={styles.myStatusRing}>
                      {myProfile?.profilePicture ? (
                        <Image source={{ uri: myProfile.profilePicture }} style={styles.myStatusAvatar} />
                      ) : (
                        <View style={[styles.myStatusAvatar, { backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={[typography.h2, { color: colors.text }]}>
                            {myProfile?.name?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.addStatusBtn, { borderColor: colors.surface }]}>
                        <Ionicons name="add" size={14} color="#fff" />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.myStatusInfo}>
                    <Text style={[typography.h3, { color: colors.text }]}>{myProfile?.name || 'You'}</Text>
                    <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 2 }]}>Tap to add a status update</Text>
                    <View style={styles.statusTagRow}>
                      <View style={[styles.statusTag, { backgroundColor: colors.surfaceSecondary }]}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 10 }]}>Coming soon</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Online Contacts */}
              {onlineUsers.filter(id => id !== userId).length > 0 && (
                <View style={styles.section}>
                  <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>Online Now</Text>
                  <FlatList
                    data={contacts.filter(c => onlineUsers.includes(c._id))}
                    keyExtractor={item => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 18, paddingBottom: 8 }}
                    renderItem={({ item }) => renderStoryRing(item)}
                  />
                </View>
              )}

              {/* All Contacts Stories */}
              <View style={styles.section}>
                <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>Recent Contacts</Text>
              </View>
            </>
          }
          ListFooterComponent={
            <>
              {contacts.length === 0 ? (
                <View style={styles.empty}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="radio-outline" size={48} color={colors.primary} />
                  </View>
                  <Text style={[typography.h3, { color: colors.text, marginTop: 16 }]}>No Updates</Text>
                  <Text style={[typography.body2, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>Add contacts to see their updates here</Text>
                </View>
              ) : (
                contacts.map(item => (
                  <TouchableOpacity key={item._id} style={styles.updateRow} activeOpacity={0.6}>
                    <View style={[styles.updateRing, { borderColor: onlineUsers.includes(item._id) ? colors.success : colors.border }]}>
                      {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.updateAvatar} />
                      ) : (
                        <View style={[styles.updateAvatar, { backgroundColor: getColor(item.name), justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={[typography.h3, { color: '#fff' }]}>{item.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.updateInfo}>
                      <Text style={[typography.body1, { color: colors.text, fontWeight: '600' }]}>{item.name}</Text>
                      <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 2 }]}>
                        {onlineUsers.includes(item._id) ? '🟢 Online' : 'No recent updates'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  section: { marginTop: 24 },
  sectionTitle: { marginLeft: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },

  // My Status
  myStatusRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, gap: 16, borderRadius: 16, padding: 16 },
  myStatusRing: { width: 72, height: 72, borderRadius: 36, padding: 3, position: 'relative' },
  myStatusAvatar: { width: '100%', height: '100%', borderRadius: 33 },
  addStatusBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#4f6ef7', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  myStatusInfo: { flex: 1 },
  statusTagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },

  // Story ring (horizontal)
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, padding: 2, position: 'relative' },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  storyOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },

  // Update list rows
  updateRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  updateRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, padding: 2 },
  updateAvatar: { width: '100%', height: '100%', borderRadius: 25 },
  updateInfo: { flex: 1 },

  empty: { alignItems: 'center', marginTop: 40, gap: 10, paddingHorizontal: 32 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
});
