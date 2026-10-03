import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
  TextInput, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { typography, shadows, metrics } from '../../constants/theme';
import { SidebarContext } from './_layout';
import * as Haptics from 'expo-haptics';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

interface Profile {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  role: string;
  createdAt: string;
  contacts: string[];
  preferences?: {
    pushNotifications: boolean;
    theme: string;
  };
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [appTheme, setAppTheme] = useState('dark');
  const router = useRouter();

  const { logout } = useAuth();
  const { colors, setTheme } = useAppTheme();
  const { openSidebar } = React.useContext(SidebarContext);

  const fetchProfile = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      const { data } = await api.get('/users/me');
      setProfile(data);
      setEditName(data.name);
      setEditBio(data.bio || '');
      if (data.preferences) {
        setNotifications(data.preferences.pushNotifications);
        setAppTheme(data.preferences.theme);
      }
    } catch (err: any) {
      if (err.response?.status === 401) { logout(); }
      else { setErrorMsg('Could not load profile. Please make sure your backend server was restarted.'); }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, []));

  const handleSave = async () => {
    if (!editName.trim()) return Alert.alert('Name is required');
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data } = await api.put('/users/me/update', { name: editName.trim(), bio: editBio.trim() });
      setProfile(data);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission required', 'Allow photo access to change your picture.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    const form = new FormData();
    form.append('media', { uri: asset.uri, type: `image/${ext}`, name: `avatar.${ext}` } as any);

    try {
      const { data: upload } = await api.post('/upload/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data: updated } = await api.put('/users/me/update', { profilePicture: upload.filePath });
      setProfile(updated);
    } catch { Alert.alert('Error', 'Failed to upload photo.'); }
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleToggleNotifications = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val && Platform.OS === 'android') {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        Alert.alert('Notifications are off', 'Allow notifications in Android settings to receive message alerts.');
        return;
      }
    }
    setNotifications(val);
    try { await api.put('/users/me/update', { preferences: { pushNotifications: val, theme: appTheme } }); }
    catch { setNotifications(!val); Alert.alert('Error', 'Failed to update preferences.'); }
  };

  const updateTheme = async (newTheme: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppTheme(newTheme);
    if (newTheme === 'dark' || newTheme === 'light') setTheme(newTheme);
    try { await api.put('/users/me/update', { preferences: { pushNotifications: notifications, theme: newTheme } }); }
    catch { Alert.alert('Error', 'Failed to update theme on server.'); }
  };

  const handleChangeTheme = () => {
    Alert.alert('Select Theme', 'Choose your preferred app theme', [
      { text: 'Dark', onPress: () => updateTheme('dark') },
      { text: 'Light', onPress: () => updateTheme('light') },
      { text: 'System', onPress: () => updateTheme('system') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const renderSkeleton = () => (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <Skeleton width={110} height={110} borderRadius={55} />
        <Skeleton width={160} height={28} style={{ marginTop: 16 }} />
        <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statsRow}>
        {[1,2,3].map(i => <View key={i} style={{ flex: 1 }}><Skeleton width="100%" height={90} borderRadius={14} /></View>)}
      </View>
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Skeleton width="100%" height={160} borderRadius={14} />
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Profile" leftComponent={<View />} elevated />
      {renderSkeleton()}
    </View>
  );

  if (errorMsg || !profile) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name="warning-outline" size={48} color={colors.error} style={{ marginBottom: 12 }} />
      <Text style={[typography.h2, { color: colors.text }]}>Profile Error</Text>
      <Text style={[typography.body1, { color: colors.textSecondary, textAlign: 'center', marginVertical: 12 }]}>{errorMsg || 'Failed to load.'}</Text>
      <Button title="Retry" onPress={fetchProfile} />
      <Button title="Logout" onPress={logout} variant="danger" style={{ marginTop: 12 }} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Profile"
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
              <Image source={require('../../assets/images/new-logo.png')} style={styles.headerAvatar} />
            </TouchableOpacity>
            <Text style={[typography.h2, { color: colors.text }]}>Profile</Text>
          </View>
        }
        rightIcon={editing ? "close" : "create-outline"}
        onRightPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditing(e => !e); }}
        elevated
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap} activeOpacity={0.8}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={[styles.avatar, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={[typography.h1, { color: '#fff', fontSize: 44 }]}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {!editing ? (
            <>
              <Text style={[typography.h2, { color: colors.text, marginTop: 8 }]}>{profile.name}</Text>
              <Text style={[typography.body1, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>{profile.bio || 'Hey there! I am using ChatMate 👋'}</Text>
            </>
          ) : (
            <View style={styles.editForm}>
              <Text style={[typography.caption, styles.inputLabel, { color: colors.textSecondary }]}>Display Name</Text>
              <TextInput
                style={[styles.textInput, typography.body1, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[typography.caption, styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Bio</Text>
              <TextInput
                style={[styles.textInput, typography.body1, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={150}
              />
              <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            </View>
          )}
        </View>

        {!editing && (
          <>
            <View style={styles.statsRow}>
              {[
                { icon: 'people', label: 'Contacts', value: profile.contacts?.length ?? 0 },
                { icon: 'calendar', label: 'Since', value: new Date(profile.createdAt).getFullYear() },
                { icon: 'shield-checkmark', label: 'Role', value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
              ].map(stat => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
                  <Ionicons name={stat.icon as any} size={24} color={colors.primary} />
                  <Text style={[typography.h3, { color: colors.text, marginTop: 4 }]}>{String(stat.value)}</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, ...shadows.sm }]}>
              <Text style={[typography.caption, styles.cardTitle, { color: colors.textSecondary }]}>Account</Text>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[typography.body2, { color: colors.text }]}>{profile.email}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Ionicons name="finger-print-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>User ID</Text>
                  <Text style={[typography.body2, { color: colors.text }]} numberOfLines={1}>{profile._id}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, ...shadows.sm }]}>
              <Text style={[typography.caption, styles.cardTitle, { color: colors.textSecondary }]}>Preferences</Text>
              <View style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                  <Text style={[typography.body1, { color: colors.text }]}>Push Notifications</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.settingRow} onPress={handleChangeTheme}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="color-palette-outline" size={20} color={colors.textSecondary} />
                  <Text style={[typography.body1, { color: colors.text }]}>App Theme</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[typography.body2, { color: colors.textSecondary }]}>{appTheme.charAt(0).toUpperCase() + appTheme.slice(1)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                  <Text style={[typography.body1, { color: colors.text }]}>App Details</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Button title="Logout" onPress={handleLogout} variant="danger" style={{ marginHorizontal: metrics.baseMargin, marginTop: 8 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 24 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3 },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 4, right: 4, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  editForm: { width: '100%', marginTop: 16 },
  inputLabel: { textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 6, borderWidth: 1 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  card: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoText: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
