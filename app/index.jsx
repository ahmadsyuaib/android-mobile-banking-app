import { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { NativeModules } from 'react-native'
import { useFreeRasp } from 'freerasp-react-native'

// App configuration
const config = {
  androidConfig: {
    packageName: 'com.ahmadsyuaib.androidmobilebankingapp',
    certificateHashes: ['mVr/qQLO8DKTwqlL+B1qigl9NoBnbiUs8b4c2Ewcz0k='],
    supportedAlternativeStores: ['com.sec.android.app.samsungapps'],
  },
  iosConfig: {
    appBundleId: 'com.ahmadsyuaib.androidmobilebankingapp',
    appTeamId: 'your_team_ID',
  },
  watcherMail: 'ahmadsyuaib02@gmail.com',
  isProd: true,
}

// Security threat tracker
let securityThreats = {
  critical: [],
  warnings: [],
  notices: []
}

let alertTimeout = null

// Function to show consolidated alert
const showConsolidatedAlert = () => {
  // Clear any existing timeout
  if (alertTimeout) {
    clearTimeout(alertTimeout)
  }
  
  // Set a timeout to show alert after a brief delay to collect multiple threats
  alertTimeout = setTimeout(() => {
    const { critical, warnings, notices } = securityThreats
    
    if (critical.length === 0 && warnings.length === 0 && notices.length === 0) {
      return
    }
    
    let alertTitle = 'Security Alert'
    let alertMessage = ''
    let shouldCloseApp = false
    
    // Handle critical threats
    if (critical.length > 0) {
      alertTitle = 'Critical Security Alert'
      alertMessage += 'CRITICAL ISSUES DETECTED:\n'
      critical.forEach(threat => {
        alertMessage += `• ${threat}\n`
      })
      alertMessage += '\nApp will close for security reasons.\n'
      shouldCloseApp = true
    }
    
    // Handle warnings
    if (warnings.length > 0) {
      if (alertMessage) alertMessage += '\n'
      alertMessage += 'SECURITY WARNINGS:\n'
      warnings.forEach(threat => {
        alertMessage += `• ${threat}\n`
      })
      if (!shouldCloseApp) {
        alertMessage += '\nApp functionality may be limited.\n'
      }
    }
    
    // Handle notices
    if (notices.length > 0) {
      if (alertMessage) alertMessage += '\n'
      alertMessage += 'SECURITY NOTICES:\n'
      notices.forEach(threat => {
        alertMessage += `• ${threat}\n`
      })
    }
    
    // Show the consolidated alert
    Alert.alert(
      alertTitle,
      alertMessage.trim(),
      [{ 
        text: 'OK', 
        onPress: shouldCloseApp ? () => BackHandler.exitApp() : undefined
      }]
    )
    
    // Clear the threats after showing alert
    securityThreats = {
      critical: [],
      warnings: [],
      notices: []
    }
  }, 500) // 500ms delay to collect multiple threats
}

// Helper function to add threat and trigger alert
const addThreat = (level, message) => {
  console.log(`${level.toUpperCase()}: ${message}`)
  securityThreats[level].push(message)
  showConsolidatedAlert()
}

// Threat reaction handlers
const actions = {
  // Critical security threats - Kill app immediately
  privilegedAccess: () => {
    addThreat('critical', 'Root/Jailbreak detected - Device is compromised')
  },
  
  debug: () => {
    addThreat('warnings', 'Debug mode is enabled')
  },
  
  simulator: () => {
    if (config.isProd) {
      addThreat('critical', 'Running on simulator/emulator in production')
    } else {
      addThreat('notices', 'Running on simulator/emulator (development mode)')
    }
  },
  
  appIntegrity: () => {
    addThreat('critical', 'App integrity compromised - App has been tampered with')
  },
  
  unofficialStore: () => {
    addThreat('warnings', 'App installed from unofficial store')
  },
  
  hooks: () => {
    addThreat('critical', 'Hooking framework detected - Malicious code injection attempt')
  },
  
  deviceBinding: () => {
    addThreat('warnings', 'Device binding verification failed')
  },
  
  secureHardwareNotAvailable: () => {
    addThreat('notices', 'Secure hardware not available on this device')
  },
  
  systemVPN: () => {
    addThreat('notices', 'VPN connection detected')
  },
  
  passcode: () => {
    addThreat('notices', 'Device passcode not set - Recommend enabling screen lock')
  },
  
  // Android only
  obfuscationIssues: () => {
    addThreat('notices', 'Code obfuscation issues detected (development feedback)')
  },
  
  devMode: () => {
    addThreat('warnings', 'Android developer mode is enabled')
  },
  
  adbEnabled: () => {
    addThreat('warnings', 'USB debugging (ADB) is enabled')
  },
  
  // Screen capture threats
  screenshot: () => {
    addThreat('notices', 'Screenshot attempt detected - Sensitive data protected')
  },
  
  screenRecording: () => {
    addThreat('warnings', 'Screen recording detected - App functionality limited')
  },
  
  // Android only
  multiInstance: () => {
    addThreat('warnings', 'Multiple app instances detected')
  },
  
  // Custom handlers for initialization
  started: () => {
    console.log('✅ freeRASP security initialized successfully')
  },
  
  initializationError: (error) => {
    console.log('❌ freeRASP initialization failed:', error)
    addThreat('critical', 'Security system initialization failed')
  }
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize freeRASP - IMPORTANT: Call outside useEffect as per documentation
  useFreeRasp(config, actions)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        // Login successful, navigate to home or protected route
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const showToast = () => {
    NativeModules.MyToastModule.showToast('Hello from native!')
  }

  return (
    <View style={styles.container}>
      <Button title="Show Native Toast" onPress={showToast} />
      <Text style={styles.title}>Login (with freeRASP Security)</Text>

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
          <Button 
            title="Login" 
            onPress={handleLogin} 
            disabled={loading}
          />
          <View style={{ marginTop: 10 }} />
          <Button 
            title="Go to Signup" 
            onPress={() => router.push('/signup')} 
            disabled={loading}
          />
        </>
      )}
    </View>
  )
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
})