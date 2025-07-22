import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { AuthMFA } from './AuthMFA';
import { EnrollMFA } from './EnrollMFA';

export function MFAWrapper({ children }) {
  const [readyToShow, setReadyToShow] = useState(false);
  const [showMFAScreen, setShowMFAScreen] = useState(false);
  const [showEnrollScreen, setShowEnrollScreen] = useState(false);

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data, error } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) {
          console.error('MFA check error:', error);
          return;
        }

        console.log('MFA Status:', data);

        // If user needs to verify MFA (they have it set up but haven't verified this session)
        if (data.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel) {
          setShowMFAScreen(true);
        }
      } catch (error) {
        console.error('MFA status check failed:', error);
      } finally {
        setReadyToShow(true);
      }
    };

    checkMFAStatus();
  }, []);

  const handleMFASuccess = () => {
    setShowMFAScreen(false);
    setShowEnrollScreen(false);
  };

  const handleEnrollSuccess = () => {
    setShowEnrollScreen(false);
  };

  const handleEnrollCancel = () => {
    setShowEnrollScreen(false);
  };

  if (!readyToShow) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showMFAScreen) {
    return <AuthMFA onSuccess={handleMFASuccess} />;
  }

  if (showEnrollScreen) {
    return (
      <EnrollMFA
        onEnrolled={handleEnrollSuccess}
        onCancelled={handleEnrollCancel}
      />
    );
  }

  // Return the wrapped children (your normal app content)
  return children;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
