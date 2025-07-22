import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MFAWrapper } from './MFAWrapper';

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/'); // Redirect to login page
    }
  };

  return (
    <MFAWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>You have successfully logged in!</Text>
        
        <View style={styles.buttonContainer}>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      </View>
    </MFAWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'lightgreen',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  buttonSpacer: {
    height: 10,
  },
});