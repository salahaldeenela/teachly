import React, { useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import CustomKeybaordView from '../components/CustomKeybaordView';
import { useAuth } from '../context/authContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function SignInScreen() {
  const navigation = useRouter();
  const refEmail = useRef('');
  const refPassword = useRef('');
  const { login } = useAuth();
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfBanned = async (email) => {
    try {
      const bannedQuery = query(
        collection(db, 'banned'),
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(bannedQuery);
      return !querySnapshot.empty; // returns true if user is banned
    } catch (error) {
      console.error('Error checking banned status:', error);
      return false; // if there's an error, assume not banned to not block legitimate users
    }
  };

  const HandleLoginIn = async () => {
    if (!refEmail.current || !refPassword.current) {
      Alert.alert('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // First check if user is banned
      const isBanned = await checkIfBanned(refEmail.current);
      
      if (isBanned) {
        Alert.alert(
          'Account Banned',
          'Your account has been banned. Please contact support if you believe this is an error.'
        );
        setIsLoading(false);
        return;
      }

      // If not banned, proceed with login
      const res = await login(refEmail.current, refPassword.current);

      if (res.success) {
        console.log('%cLogin successful', 'color: green; font-weight: bold;');
      } else {
        console.log('%cLogin failed', 'color: red; font-weight: bold;');
        if (res.message.includes('(auth/invalid-email)')) {
          console.log('%cInvalid email address format!', 'color: red;');
          Alert.alert('Invalid email', 'Please add a valid email');
        }
        if (res.message.includes('(auth/invalid-credential)')) {
          console.log('%cInvalid password provided!', 'color: red;');
          Alert.alert('Invalid password', 'Please enter the correct password');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 px-8 bg-bgWhite">
      <View className="flex justify-around flex-1 my-4">
        <View className="flex-row justify-center mb-[-15%]">
          <Image
            source={require('../assets/images/signin.png')}
            style={{ width: 266, height: 266 }}
          />
        </View>

        <View className="flex flex-col justify-center w-full mt-3 space-y-4">
          <CustomKeybaordView>
            <TextInput
              label="Email address"
              mode="outlined"
              onChangeText={(text) => (refEmail.current = text)}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-4"
            />
            <TextInput
              label="Password"
              mode="outlined"
              onChangeText={(text) => (refPassword.current = text)}
              placeholder="********"
              secureTextEntry={secureText}
              right={
                <TextInput.Icon
                  icon={secureText ? 'eye-off' : 'eye'}
                  onPress={() => setSecureText(!secureText)}
                />
              }
            />
          </CustomKeybaordView>
        </View>

        <View className="mt-4 space-y-4">
          <Button
            mode="contained"
            onPress={HandleLoginIn}
            contentStyle={{ paddingVertical: 8 }}
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>

          <View className="flex-row justify-center mt-2">
            <Text className="text-center">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.push('/signUp')}>
              <Text className="font-semibold text-blue-500">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}