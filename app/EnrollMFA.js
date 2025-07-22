import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { supabase } from '../lib/supabase';

export function EnrollMFA({ onEnrolled, onCancelled }) {
  const [factorId, setFactorId] = useState('');
  const [qrSvg, setQRSvg] = useState(''); // holds the QR code SVG string
  const [verifyCode, setVerifyCode] = useState(''); // contains the code entered by the user
  const [error, setError] = useState(''); // holds an error message
  const [loading, setLoading] = useState(false);

  const onEnableClicked = async () => {
    if (!verifyCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }

      const challengeId = challenge.data.id;
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });

      if (verify.error) {
        setError(verify.error.message);
        return;
      }

      Alert.alert('Success', 'MFA has been enabled successfully!');
      onEnrolled();
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('MFA enrollment error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const enrollMFA = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        });

        if (error) {
          setError(error.message);
          return;
        }

        console.log('MFA enrollment data:', data);

        setFactorId(data.id);

        if (data.totp && data.totp.qr_code) {
          const svgString = data.totp.qr_code;
          console.log('QR code SVG received');
          setQRSvg(svgString);
        } else {
          setError('QR code not received from server');
          console.error('QR code data missing:', data);
        }
      } catch (error) {
        setError('Failed to initialize MFA enrollment');
        console.error('MFA enrollment initialization error:', error);
      }
    };

    enrollMFA();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enable Two-Factor Authentication</Text>

      <Text style={styles.instructions}>
        1. Install an authenticator app (Google Authenticator, Authy, etc.)
      </Text>
      <Text style={styles.instructions}>
        2. Scan the QR code below with your authenticator app
      </Text>
      <Text style={styles.instructions}>
        3. Enter the 6-digit code from your authenticator app
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {qrSvg ? (
        <View style={styles.qrContainer}>
          <SvgXml xml={qrSvg} width={220} height={220} />
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading QR code...</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        value={verifyCode}
        onChangeText={(text) => setVerifyCode(text.trim())}
        keyboardType="numeric"
        maxLength={6}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Enabling...' : 'Enable MFA'}
          onPress={onEnableClicked}
          disabled={loading || !verifyCode.trim()}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Cancel"
          onPress={onCancelled}
          color="#666"
          disabled={loading}
        />
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonSpacer: {
    height: 10,
  },
});
