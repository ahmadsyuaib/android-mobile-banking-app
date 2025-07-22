import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, NativeModules } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { EnrollMFA } from './EnrollMFA';

const { MyToastModule, OverlayWindowModule } = NativeModules;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [loginStep, setLoginStep] = useState('login'); // 'login' or 'mfa_setup'

  const handleLogin = async () => {
    const isValidEmail = (email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        Alert.alert('Login Error', error.message);
        setLoading(false);
        return;
      }

      // Check if user has MFA enabled
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) {
        Alert.alert('Error', 'Unable to check MFA status');
        setLoading(false);
        return;
      }

      const hasMFA = factors.data.totp.length > 0;
      
      if (!hasMFA) {
        // User doesn't have MFA set up - force them to set it up
        setLoginStep('mfa_setup');
        setShowMFAEnrollment(true);
      } else {
        // User has MFA - the MFAWrapper will handle verification
        router.replace('/home');
      }

    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAEnrollmentComplete = () => {
    setShowMFAEnrollment(false);
    setLoginStep('login');
    router.replace('/home');
  };

  const handleMFAEnrollmentCancel = () => {
    // Don't allow canceling - MFA is mandatory
    Alert.alert(
      'MFA Required',
      'Two-factor authentication is required to use this application. Please complete the setup to continue.',
      [{ text: 'OK' }]
    );
  };

  const showToast = () => {
    MyToastModule?.showToast('Hello from native!');
  };

  useEffect(() => {
    // On app start, restore overlay setting
    const restoreOverlaySetting = async () => {
      const value = await AsyncStorage.getItem('overlayHidden');
      if (value !== null) {
        const hidden = value === 'true';
        OverlayWindowModule?.setHideOverlay(hidden);
        setOverlayHidden(hidden);
      }
    };

    restoreOverlaySetting();
  }, []);

  const toggleOverlay = async () => {
    const newState = !overlayHidden;
    OverlayWindowModule?.setHideOverlay(newState);
    setOverlayHidden(newState);
    await AsyncStorage.setItem('overlayHidden', newState.toString());
  };

  if (showMFAEnrollment) {
    return (
      <View style={styles.container}>
        <Text style={styles.mfaTitle}>Security Setup Required</Text>
        <Text style={styles.mfaSubtitle}>
          Two-factor authentication is required to access this application. Please complete the setup below.
        </Text>
        <EnrollMFA
          onEnrolled={handleMFAEnrollmentComplete}
          onCancelled={handleMFAEnrollmentCancel}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Show Native Toast" onPress={showToast} />
      <View style={{ marginTop: 10 }} />
      <Button
        title={overlayHidden ? 'Disable Overlay Protection' : 'Enable Overlay Protection'}
        onPress={toggleOverlay}
      />
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Login" onPress={handleLogin} disabled={loading} />
          <View style={{ marginTop: 10 }} />
          <Button title="Go to Signup" onPress={() => router.push('/signup')} disabled={loading} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  mfaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  mfaSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
});