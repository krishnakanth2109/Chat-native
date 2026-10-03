import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await api.put('/auth/me/password', { currentPassword, newPassword });
      Alert.alert('Success', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1a" />
      <SafeAreaView style={s.safeArea}>
        {/* Custom Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} /> {/* balance spacing */}
        </View>

        <View style={s.content}>
          <Text style={s.label}>Current Password</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="#475569"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={s.label}>New Password</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            placeholder="Enter new password"
            placeholderTextColor="#475569"
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={s.label}>Confirm New Password</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor="#475569"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070d1a' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '600' },
  content: { padding: 24, paddingTop: 40 },
  label: { color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
