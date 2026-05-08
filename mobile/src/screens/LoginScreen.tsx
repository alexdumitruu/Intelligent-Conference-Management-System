import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiClient from '../api/client';
import { saveToken } from '../utils/storage';
import type { LoginResponse, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        password,
      });
      await saveToken(data.accessToken);
      navigation.replace('Dashboard');
    } catch (err: any) {
      console.log('LOGIN ERROR:', JSON.stringify(err, null, 2));
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Invalid email or password.');
      } else if (err?.code === 'ERR_NETWORK') {
        setError('Network error. Check your connection.');
      } else if (err?.code === 'ECONNABORTED') {
        setError('Request timed out. Is the backend running?');
      } else {
        setError(`Debug: ${err?.code || 'unknown'} — ${err?.message || String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* ── Header ──────────────────────────────── */}
        <Text style={styles.brand}>ICMS</Text>
        <Text style={styles.subtitle}>
          Intelligent Conference{'\n'}Management System
        </Text>

        {/* ── Form ────────────────────────────────── */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="author@university.edu"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Author Portal</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles: Editorial Minimalist ───────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  form: {
    marginTop: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 12,
  },
  button: {
    height: 48,
    backgroundColor: '#0055FF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 48,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
