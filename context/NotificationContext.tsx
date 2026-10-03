import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { SocketContext } from './SocketContext';
import Toast from '../components/Toast';
import { Message } from '../types';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const socketContext = useContext(SocketContext);
  const router = useRouter();
  const pathname = usePathname();
  
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: '',
    message: '',
    senderId: '',
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!socketContext?.socket) return;

    const handleReceiveMessage = async (newMessage: Message) => {
      const isCurrentlyInChat = pathname.includes(`/(chat)/${newMessage.sender}`);
      
      if (!isCurrentlyInChat) {
        let preview = newMessage.content || 'Sent an attachment';
        if (newMessage.messageType === 'image') preview = '📷 Sent a photo';
        if (newMessage.messageType === 'document') preview = '📄 Sent a document';
        if (newMessage.messageType === 'location') preview = '📍 Shared a location';

        // If app is foreground, show custom in-app Toast
        if (appState === 'active') {
          setToastConfig({
            visible: true,
            title: 'New Message',
            message: preview,
            senderId: newMessage.sender,
          });
        } else {
          // If app is backgrounded/locked, show Native OS Notification
          const channelId = await notifee.createChannel({
            id: 'messages',
            name: 'Messages',
            importance: AndroidImportance.HIGH,
            vibration: true,
            vibrationPattern: [300, 500, 300, 500], // Custom vibration pattern
          });

          await notifee.displayNotification({
            title: 'New Message',
            body: preview,
            data: {
              type: 'new_message',
              senderId: newMessage.sender,
            },
            android: {
              channelId,
              smallIcon: 'ic_launcher', // fallback icon
              pressAction: {
                id: 'default',
              },
            },
          });
        }
      }
    };

    socketContext?.socket?.on('receive_message', handleReceiveMessage);

    return () => {
      socketContext?.socket?.off('receive_message', handleReceiveMessage);
    };
  }, [socketContext?.socket, pathname, appState]);

  // Handle Foreground / Background notification taps
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          if (detail.notification?.data?.type === 'new_message') {
            const senderId = detail.notification.data.senderId as string;
            router.push({
              pathname: "/(main)/(chat)/[id]",
              params: { id: senderId, name: "Chat" }
            } as any);
          }
          break;
      }
    });
  }, []);

  const handleToastPress = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
    if (toastConfig.senderId) {
      router.push({
        pathname: "/(main)/(chat)/[id]",
        params: { id: toastConfig.senderId, name: "Chat" }
      } as any);
    }
  };

  const handleToastDismiss = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      <Toast 
        visible={toastConfig.visible}
        title={toastConfig.title}
        message={toastConfig.message}
        onPress={handleToastPress}
        onDismiss={handleToastDismiss}
      />
    </NotificationContext.Provider>
  );
};
