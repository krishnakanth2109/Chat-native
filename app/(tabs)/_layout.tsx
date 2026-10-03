import React, { createContext, useContext, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Image } from 'expo-image';

interface SidebarContextType {
  openSidebar: () => void;
  closeSidebar: () => void;
}
export const SidebarContext = createContext<SidebarContextType>({ openSidebar: () => {}, closeSidebar: () => {} });

const { width } = Dimensions.get('window');

function SidebarMenu({ close, anim }: { close: () => void, anim: Animated.Value }) {
  const { colors, toggleTheme, isDark } = useAppTheme();
  const { logout } = useAuth();
  
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999, pointerEvents: anim.interpolate({ inputRange: [0,0.01,1], outputRange: ['none', 'auto', 'auto'] }) as any }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: anim }]} />
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
      
      <Animated.View style={{ 
        position: 'absolute', top: 0, bottom: 0, left: 0, width: width * 0.75, 
        backgroundColor: colors.surface, 
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
        paddingTop: 60, paddingHorizontal: 20,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, shadowOffset: { width: 5, height: 0 }
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
          <Image source={require('../../assets/images/new-logo.png')} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>ChatMate</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Settings & More</Text>
          </View>
        </View>

        <TouchableOpacity onPress={toggleTheme} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={colors.primary} style={{ marginRight: 15 }} />
          <Text style={{ color: colors.text, fontSize: 16 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name="person-outline" size={22} color={colors.primary} style={{ marginRight: 15 }} />
          <Text style={{ color: colors.text, fontSize: 16 }}>Profile Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} style={{ marginRight: 15 }} />
          <Text style={{ color: colors.text, fontSize: 16 }}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name="help-buoy-outline" size={22} color={colors.primary} style={{ marginRight: 15 }} />
          <Text style={{ color: colors.text, fontSize: 16 }}>Help & Support</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginBottom: 30 }}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{ marginRight: 15 }} />
          <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors } = useAppTheme();
  const [slideAnim] = useState(() => new Animated.Value(0));

  const openSidebar = () => {
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };
  const closeSidebar = () => {
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  return (
    <SidebarContext.Provider value={{ openSidebar, closeSidebar }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 62,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
          }}
        >
          <Tabs.Screen name="contacts" options={{ title: 'Chats', tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={23} color={color} />
            </View>
          )}} />
          <Tabs.Screen name="updates" options={{ title: 'Updates', tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={focused ? 'radio' : 'radio-outline'} size={23} color={color} />
            </View>
          )}} />
          <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={23} color={color} />
            </View>
          )}} />
          <Tabs.Screen name="invites" options={{ title: 'Requests', tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} />
            </View>
          )}} />
          <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={23} color={color} />
            </View>
          )}} />
        </Tabs>
        
        <SidebarMenu close={closeSidebar} anim={slideAnim} />
      </View>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 40, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
