import React, { useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import CustomKeybaordView from '../components/CustomKeybaordView';
import { useAuth } from '../context/authContext';

export default function SignInScreen() {
  const navigation = useRouter();
  const refEmail = useRef('');
  const refPassword = useRef('');
  const { login } = useAuth();
  const [secureText, setSecureText] = useState(true);

  const HandleLoginIn = async () => {
    if (!refEmail.current || !refPassword.current) {
      Alert.alert('Please enter your email and password');
      return;
    }

    const res = await login(refEmail.current, refPassword.current);

    // Improved console logging
    if (res.succsess) {
      console.log('%cLogin successfuls', 'color: green; font-weight: bold;');
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
