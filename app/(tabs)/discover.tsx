import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import api from '../../services/api';
import { socket } from '../../services/socket';
import { useAppTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { typography, shadows, metrics } from '../../constants/theme';
import { SidebarContext } from './_layout';
import * as Haptics from 'expo-haptics';

export default function DiscoverScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { colors } = useAppTheme();
  const { openSidebar } = React.useContext(SidebarContext);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users/discover');
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const task = setTimeout(() => { void loadUsers(); }, 0);
    return () => clearTimeout(task);
  }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadUsers();
  };

  const sendInvite = async (receiverId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/users/invite/${receiverId}`);
      socket.emit('send_invite', { receiverId });
      Alert.alert('Success', 'Invite sent! 🚀');
      loadUsers(); // Refresh list to remove the person we just invited
    } catch (error) {
      Alert.alert('Error', 'Could not send invite');
    }
  };

  const renderSkeleton = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 16 }} />
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
        title="Discover"
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
              <Image source={require('../../assets/images/new-logo.png')} style={styles.headerAvatar} />
            </TouchableOpacity>
            <View>
              <Text style={[typography.h2, { color: colors.text, lineHeight: 28 }]}>Discover</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Find new people to chat with</Text>
            </View>
          </View>
        }
        elevated
      />

      {loading ? renderSkeleton() : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="search" size={48} color={colors.primary} />
              </View>
              <Text style={[typography.h3, { color: colors.text, marginTop: 16 }]}>Nobody to discover</Text>
              <Text style={[typography.body2, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>You&apos;ve connected with everyone!</Text>
              <Button title="Refresh List" onPress={onRefresh} style={{ marginTop: 24, width: '100%' }} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image 
                  source={item.profilePicture ? { uri: item.profilePicture } : require('../../assets/images/new-logo.png')} 
                  style={styles.avatar} 
                  contentFit="cover"
              />
              
              <View style={styles.cardContent}>
                <Text style={[typography.body1, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.email}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.connectBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => sendInvite(item._id)}
              >
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={[typography.button, styles.connectBtnText]}>Add</Text>
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
  listContainer: { paddingBottom: 24, paddingHorizontal: metrics.baseMargin },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...shadows.sm,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  cardContent: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    ...shadows.sm,
  },
  connectBtnText: { color: '#ffffff', fontSize: 13, marginLeft: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
});
