import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { KeyboardProvider, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import api from '../../../services/api';
import { socket, connectSocket } from '../../../services/socket';
import { useAuth } from '../../../context/AuthContext';
import { CallContext } from '../../../context/CallContext';
import { useAppTheme } from '../../../context/ThemeContext';
import { Header } from '../../../components/ui/Header';
import { typography } from '../../../constants/theme';
import { Message } from '../../../components/chat/types';
import { Bubble } from '../../../components/chat/Bubble';
import { ChatInputBar } from '../../../components/chat/ChatInputBar';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string; name: string; avatar: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : (params.avatar || '');
  const { userId } = useAuth();
  const callContext = React.useContext(CallContext);
  const { colors } = useAppTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async (pageNum: number = 1) => {
    if (!id) return;
    try {
      const { data } = await api.get<Message[]>(`/messages/${id}?page=${pageNum}&limit=30`);
      if (data.length < 30) setHasMore(false);
      setMessages(prev => pageNum === 1 ? data : [...prev, ...data]);
      setPage(pageNum);
    } catch (err: any) { console.error(err?.message); }
    finally { if (pageNum === 1) setLoading(false); }
  }, [id]);

  useEffect(() => {
    const task = setTimeout(() => { void loadMessages(1); }, 0);
    return () => clearTimeout(task);
  }, [loadMessages]);

  useEffect(() => {
    const onMsg = (msg: any) => {
      const sid = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
      const rid = typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver;
      if ((sid === id && rid === userId) || (sid === userId && rid === id)) {
        setMessages(prev => {
          const exists = prev.find(m => (m._id === msg._id || (m.content === msg.content && m.status === 'pending')) && m.sender === sid);
          if (exists) return prev.map(m => m._id === exists._id ? { ...m, ...msg, status: 'sent' } : m);
          return [{ ...msg, sender: sid, receiver: rid, status: 'sent' }, ...prev];
        });
      }
    };
    const onOnline = (ids: string[]) => setIsOnline(ids.includes(id ?? ''));
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);
    socket.on('receive_message', onMsg); socket.on('getOnlineUsers', onOnline);
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('receive_message', onMsg); socket.off('getOnlineUsers', onOnline);
      socket.off('connect', onConnect); socket.off('disconnect', onDisconnect);
    };
  }, [id, userId]);

  const emitMessage = useCallback((payload: any, cid: string) => {
    if (!socket.connected && userId) connectSocket(userId);
    socket.emit('send_message', payload, (r: any) => {
      if (r?.status === 'ok') setMessages(prev => prev.map(m => m._id === cid ? { ...r.data, status: 'sent' } : m));
      else setMessages(prev => prev.map(m => m._id === cid ? { ...m, status: 'error' } : m));
    });
  }, [userId]);

  const sendText = useCallback((t: string) => {
    if (!t || !userId) return;
    const cid = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [{ _id: cid, sender: userId, receiver: id, messageType: 'text', content: t, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
    emitMessage({ sender: userId, receiver: id, messageType: 'text', content: t }, cid);
  }, [userId, id, emitMessage]);

  const sendEmoji = useCallback((e: string) => {
    if (!userId) return;
    const cid = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [{ _id: cid, sender: userId, receiver: id, messageType: 'emoji', content: e, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
    emitMessage({ sender: userId, receiver: id, messageType: 'text', content: e }, cid);
  }, [userId, id, emitMessage]);

  const sendSticker = useCallback((st: string) => {
    if (!userId) return;
    const cid = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [{ _id: cid, sender: userId, receiver: id, messageType: 'sticker', content: st, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
    emitMessage({ sender: userId, receiver: id, messageType: 'text', content: st }, cid);
  }, [userId, id, emitMessage]);

  const uploadFile = async (uri: string, type: 'image' | 'document', fileName?: string) => {
    const ext = uri.split('.').pop() || 'bin';
    const mime = type === 'image' ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'application/octet-stream';
    const form = new FormData();
    form.append('media', { uri, type: mime, name: fileName || `file.${ext}` } as any);
    const { data } = await api.post('/upload/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (!data.filePath) throw new Error('No filePath');
    return data.filePath as string;
  };

  const pickImage = useCallback(async (useCamera = false) => {
    setShowAttach(false); let cid = '';
    try {
      let res: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) return Alert.alert('Permission required');
        res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else { res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 }); }
      if (res.canceled) return;
      const localUri = res.assets[0].uri;
      cid = Date.now().toString() + Math.random().toString(36).slice(2);
      setMessages(prev => [{ _id: cid, sender: userId!, receiver: id, messageType: 'image', fileUrl: localUri, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
      setSending(true);
      const url = await uploadFile(localUri, 'image');
      emitMessage({ sender: userId, receiver: id, messageType: 'image', fileUrl: url }, cid);
    } catch {
      if (cid) setMessages(prev => prev.map(m => m._id === cid ? { ...m, status: 'error' } : m));
    } finally { setSending(false); }
  }, [userId, id, emitMessage]);

  const sendLocation = useCallback(async () => {
    setShowAttach(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied', 'Enable location access.');
    try {
      setSending(true);
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!loc) return;
      let address = '';
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo.length > 0) {
          const g = geo[0];
          address = [g.name, g.district, g.city, g.region].filter(Boolean).slice(0, 3).join(', ');
        }
      } catch { }
      const cid = Date.now().toString() + Math.random().toString(36).slice(2);
      setMessages(prev => [{ _id: cid, sender: userId!, receiver: id, messageType: 'location', location: { lat: loc!.coords.latitude, lng: loc!.coords.longitude, address }, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
      socket.emit('send_message', { sender: userId, receiver: id, messageType: 'location', location: { lat: loc.coords.latitude, lng: loc.coords.longitude, address } }, (r: any) => {
        if (r?.status === 'ok') setMessages(prev => prev.map(m => m._id === cid ? { ...r.data, status: 'sent' } : m));
        else setMessages(prev => prev.map(m => m._id === cid ? { ...m, status: 'error' } : m));
      });
    } catch (err: any) { Alert.alert('Error', err?.message || 'Could not get location.'); }
    finally { setSending(false); }
  }, [userId, id]);

  const sendVoiceMessage = useCallback(async (uri: string) => {
    const cid = Date.now().toString() + Math.random().toString(36).slice(2);
    try {
      setMessages(prev => [{ _id: cid, sender: userId!, receiver: id, messageType: 'voice', fileUrl: uri, createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
      setSending(true);
      const url = await uploadFile(uri, 'document', 'voice.m4a');
      emitMessage({ sender: userId, receiver: id, messageType: 'voice', fileUrl: url }, cid);
    } catch {
      setMessages(prev => prev.map(m => m._id === cid ? { ...m, status: 'error' } : m));
    } finally { setSending(false); }
  }, [userId, id, emitMessage]);

  const displayName = name || 'Chat';

  return (
    <KeyboardProvider>
      <View style={s.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header 
          title={displayName} 
          showBack 
          avatarUrl={avatar}
          rightIcon="videocam-outline"
          onRightPress={() => callContext?.startCall(id, true)}
          elevated
        />
        {!isSocketConnected && <View style={{ backgroundColor: colors.error, paddingVertical: 4, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Reconnecting…</Text></View>}

        <KeyboardAwareScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          bottomOffset={0} 
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 12 }]}>Loading messages…</Text>
            </View>
          ) : (
            <FlatList 
              ref={listRef} 
              data={messages} 
              inverted 
              keyExtractor={item => item._id}
              renderItem={({ item }) => { 
                const sid = typeof item.sender === 'object' ? (item.sender as any)._id : item.sender; 
                return <Bubble item={item} isMe={sid === userId} />; 
              }}
              contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
              onEndReached={() => { if (hasMore) loadMessages(page + 1); }}
              onEndReachedThreshold={0.5} 
              initialNumToRender={20} 
              maxToRenderPerBatch={15} 
              windowSize={7}
              removeClippedSubviews={true}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={{ fontSize: 64 }}>👋</Text>
                  <Text style={[typography.h3, { color: colors.text, marginTop: 16 }]}>Say hello to {displayName}!</Text>
                  <Text style={[typography.body2, { color: colors.textSecondary, marginTop: 8 }]}>Start a conversation securely</Text>
                </View>
              }
            />
          )}
          <ChatInputBar 
            onSend={sendText} 
            onSendEmoji={sendEmoji} 
            onSendSticker={sendSticker} 
            sending={sending}
            showAttach={showAttach} 
            setShowAttach={setShowAttach} 
            pickImage={pickImage}
            sendLocation={sendLocation} 
            sendVoiceMessage={sendVoiceMessage} 
          />
        </KeyboardAwareScrollView>
      </View>
    </KeyboardProvider>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 24, transform: [{ scaleY: -1 }] },
});
