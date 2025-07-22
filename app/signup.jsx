import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { weakPasswords } from '../lib/weakPasswords';
import { EnrollMFA } from './EnrollMFA';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);

  const handleSignup = async () => {
    const isValidEmail = (email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long');
      return;
    }

    if (weakPasswords.includes(password)) {
      Alert.alert('Weak Password', 'This password is too common or easily guessable. Please choose another.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      setSignupComplete(true);
      Alert.alert(
        'Signup Success',
        'Please check your email to confirm your account. You will need to set up two-factor authentication to complete your registration.',
        [
          {
            text: 'Continue',
            onPress: () => setShowMFAEnrollment(true)
          }
        ]
      );
    }
  };

  const handleMFAEnrollmentComplete = () => {
    setShowMFAEnrollment(false);
    router.replace('/home');
  };

  const handleMFAEnrollmentCancel = () => {
    setShowMFAEnrollment(false);
    router.replace('/home');
  };

  if (showMFAEnrollment) {
    return (
      <EnrollMFA
        onEnrolled={handleMFAEnrollmentComplete}
        onCancelled={handleMFAEnrollmentCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Button 
        title={loading ? 'Signing Up...' : 'Sign Up'} 
        onPress={handleSignup} 
        disabled={loading} 
      />
      <View style={{ marginTop: 10 }} />
      <Button title="Back to Login" onPress={() => router.back()} />
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