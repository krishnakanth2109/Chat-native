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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Hold up!', 'Please fill in all fields.');
      return; 
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      await login(res.data.token);
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Registration failed';
      Alert.alert('Error', msg);
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
                  style={{ width: 64, height: 64, borderRadius: 32 }} 
                  contentFit="cover" 
                />
              </Animated.View>

              <Animated.View style={{ 
                opacity: textAnim, 
                transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
              }}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join ChatMate and connect today</Text>
              </Animated.View>
            </View>
            
            <Animated.View style={[styles.form, { 
              opacity: formAnim, 
              transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] 
            }]}>
              <View style={styles.inputContainer}>
                <Ionicons name="id-card-outline" size={22} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Full Name" 
                  placeholderTextColor="#64748b"
                  style={styles.input} 
                  value={name} 
                  onChangeText={setName} 
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Email Address" 
                  placeholderTextColor="#64748b"
                  style={styles.input} 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                onPress={handleRegister} 
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6d28d9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: formAnim }]}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auths)/login" asChild>
                <TouchableOpacity activeOpacity={0.6}>
                  <Text style={styles.link}>Log In</Text>
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
  header: { alignItems: 'center', marginBottom: 44 },
  iconGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
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
    marginTop: 36,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: '#a78bfa',
    fontWeight: '700',
    fontSize: 15,
  }
});
