import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../../services/api';
import { socket } from '../../services/socket';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Header } from '../../components/ui/Header';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { typography, shadows, metrics } from '../../constants/theme';
import { SidebarContext } from './_layout';
import * as Haptics from 'expo-haptics';

export default function InvitesScreen() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useAppTheme();
  const { openSidebar } = React.useContext(SidebarContext);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/users/invites');
      setInvites(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const task = setTimeout(() => { void fetchInvites(); }, 0);
    socket.on('new_invite', fetchInvites);
    return () => { clearTimeout(task); socket.off('new_invite'); };
  }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchInvites();
  };

  const acceptInvite = async (senderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/users/invite/accept/${senderId}`);
      socket.emit('accept_invite', { senderId });
      fetchInvites(); 
    } catch (error) {
      console.log("Error accepting invite", error);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 15 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
          <Skeleton width={80} height={36} borderRadius={18} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Friend Requests"
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
              <Image source={require('../../assets/images/new-logo.png')} style={styles.headerAvatar} />
            </TouchableOpacity>
            <Text style={[typography.h2, { color: colors.text }]}>Requests</Text>
          </View>
        }
        elevated
      />
      
      {loading ? renderSkeleton() : (
        <FlatList
          data={invites}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item: any) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[typography.h3, { color: colors.text, marginTop: 16 }]}>No pending invites</Text>
              <Text style={[typography.body2, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>When someone sends you a request, it will appear here.</Text>
              <Button title="Check Again" onPress={onRefresh} variant="secondary" style={{ marginTop: 24, width: '100%' }} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.userInfo}>
                <Image
                  source={item.avatar ? { uri: item.avatar } : require('../../assets/images/new-logo.png')}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.textContainer}>
                  <Text style={[typography.body1, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.email}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.acceptButton, { backgroundColor: colors.primary }]} 
                onPress={() => acceptInvite(item._id)}
                activeOpacity={0.8}
              >
                <Text style={[typography.button, { color: '#FFF', fontSize: 13 }]}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  listContent: { padding: metrics.baseMargin, paddingBottom: 24 },
  card: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1,
    ...shadows.sm,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  textContainer: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  acceptButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm, marginLeft: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
});
