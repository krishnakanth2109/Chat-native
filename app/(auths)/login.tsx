import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Animated, Dimensions 
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function Login() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation Values
  const [iconAnim] = useState(() => new Animated.Value(0));
  const [textAnim] = useState(() => new Animated.Value(0));
  const [formAnim] = useState(() => new Animated.Value(0));

  const { login } = useAuth();

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(iconAnim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
      Animated.spring(textAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!input.trim() || !password.trim()) {
      Alert.alert('Hold up!', 'Please enter both username/email and password.');
      return; 
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: input, password });
      await login(res.data.token);
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Connection Error';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Premium Dark Gradient Background */}
      <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          
          <View style={styles.content}>
            
            <View style={styles.header}>
              <Animated.View style={[styles.iconGlow, { 
                opacity: iconAnim, 
                transform: [
                  { scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                  { translateY: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }
                ] 
              }]}>
                <Image 
                  source={require('../../assets/images/new-logo.png')} 
                  style={{ width: 70, height: 70, borderRadius: 35 }} 
                  contentFit="cover" 
                />
              </Animated.View>

              <Animated.View style={{ 
                opacity: textAnim, 
                transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
              }}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>
              </Animated.View>
            </View>
            
            <Animated.View style={[styles.form, { 
              opacity: formAnim, 
              transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] 
            }]}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Email or Username" 
                  placeholderTextColor="#64748b"
                  style={styles.input} 
                  value={input} 
                  onChangeText={setInput} 
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Password" 
                  placeholderTextColor="#64748b"
                  style={styles.input} 
                  secureTextEntry 
                  value={password} 
                  onChangeText={setPassword} 
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && { opacity: 0.8 }]} 
                onPress={handleLogin} 
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#3b82f6', '#4f46e5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: formAnim }]}>
              <Text style={styles.footerText}>New here? </Text>
              <Link href="/(auths)/register" asChild>
                <TouchableOpacity activeOpacity={0.6}>
                  <Text style={styles.link}>Create an account</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
            
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
  },
  header: { alignItems: 'center', marginBottom: 48 },
  iconGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    paddingHorizontal: 20,
    height: 64,
  },
  inputIcon: { marginRight: 14 },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    height: '100%',
  },
  button: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 15,
  }
});
