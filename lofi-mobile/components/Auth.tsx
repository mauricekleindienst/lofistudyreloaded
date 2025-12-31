import React, { useState, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Mail, Lock, LogIn, UserPlus, Github } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

// --- Sub-Components ---

const SocialButton = memo(({ icon: Icon, label, color, onPress, disabled, isFA = false }: any) => (
  <TouchableOpacity 
    style={styles.socialButton} 
    onPress={onPress}
    disabled={disabled}
  >
    {isFA ? <FontAwesome5 name={Icon} size={20} color={color} /> : <Icon size={20} color={color} />}
    <Text style={styles.socialButtonText}>{label}</Text>
  </TouchableOpacity>
));

const AuthInput = memo(({ icon: Icon, placeholder, value, onChange, secure = false, type = 'none' }: any) => (
  <View style={styles.inputWrapper}>
    <Icon size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary}
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
      secureTextEntry={secure}
      keyboardType={type}
    />
  </View>
));

// --- Main Component ---

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithProvider } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password');

    setLoading(true);
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (error) Alert.alert('Authentication Failed', error.message);
      else if (isSignUp) {
        Alert.alert('Success', 'Check your email for the confirmation link!');
        setIsSignUp(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'discord' | 'github') => {
    setLoading(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error && error.type !== 'dismiss') Alert.alert('Sign In Failed', error.message || 'Could not sign in with provider');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.card}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Sign up to sync your stats and join the chat' : 'Sign in to access your profile'}
        </Text>

        <View style={styles.inputContainer}>
          <AuthInput icon={Mail} placeholder="Email" value={email} onChange={setEmail} type="email-address" />
          <AuthInput icon={Lock} placeholder="Password" value={password} onChange={setPassword} secure />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {isSignUp ? <UserPlus size={20} color="#fff" /> : <LogIn size={20} color="#fff" />}
              <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <SocialButton icon="discord" label="Discord" color="#5865F2" isFA onPress={() => handleOAuthSignIn('discord')} disabled={loading} />
          <SocialButton icon={Github} label="GitHub" color="#fff" onPress={() => handleOAuthSignIn('github')} disabled={loading} />
          <SocialButton icon="google" label="Google" color="#DB4437" isFA onPress={() => handleOAuthSignIn('google')} disabled={loading} />
        </View>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        <View style={styles.legalContainer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://lo-fi.study/legal')}>
            <Text style={styles.legalText}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://lo-fi.study/privacy')}>
            <Text style={styles.legalText}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md, justifyContent: 'center' },
  card: { padding: theme.spacing.xl, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32, textAlign: 'center' },
  inputContainer: { gap: 16, marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 50, color: theme.colors.textPrimary, fontSize: 16 },
  button: { backgroundColor: theme.colors.accent, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: theme.colors.textSecondary, fontSize: 12 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  socialButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 8 },
  socialButtonText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '600' },
  switchButton: { alignItems: 'center' },
  switchText: { color: theme.colors.textSecondary, fontSize: 14 },
  legalContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 24, opacity: 0.6 },
  legalText: { color: theme.colors.textSecondary, fontSize: 12 },
  legalDivider: { color: theme.colors.textSecondary, fontSize: 12 },
});
