import { View, Image, TouchableOpacity, Alert } from 'react-native';
import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/authContext'; // adjust path
import { ScrollView } from 'react-native';

export default function SignUpScreen() {
  const navigation = useRouter();

  const refName = useRef('');
  const refEmail = useRef('');
  const refPassword = useRef('');
  const refRate = useRef('');

  const { setSignUpInfo } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('student');
  const [gender, setGender] = useState('male'); // ✅ Gender state added

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    return password && password.length >= 6;
  };

  const validateName = (name) => {
    return name && name.trim() !== '';
  };

  const handleSubmit = () => {
    const name = refName.current;
    const email = refEmail.current;
    const password = refPassword.current;

    if (!validateName(name)) {
      Alert.alert('Validation Error', 'Please enter a valid name.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 6 characters long.',
      );
      return;
    }

    if (userType === 'tutor' && (!refRate.current || isNaN(refRate.current))) {
      Alert.alert('Validation Error', 'Please enter a valid hourly rate.');
      return;
    }

    // ✅ Submit including gender
    setSignUpInfo({
      name,
      email,
      password,
      userType,
      gender,
      ...(userType === 'tutor' && { rate: refRate.current }),
    });

    navigation.push('/selectGrade');
  };

  return (
    <SafeAreaView className="flex-1 px-8 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex justify-between flex-1">
          <View className="flex-row justify-center mb-[-5%] mt-[-10%]">
            <Image
              source={require('../assets/images/signup.png')}
              style={{ width: 353, height: 235 }}
            />
          </View>

          <View className="flex flex-col w-full mt-3 space-y-4">
            <TextInput
              label="Name"
              mode="outlined"
              onChangeText={(text) => (refName.current = text)}
            />
            <TextInput
              label="Email address"
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => (refEmail.current = text)}
            />
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              onChangeText={(text) => (refPassword.current = text)}
            />
          </View>

          {/* ====== Gender Selection ======= */}
          <View className="mt-4">
            <Text className="mb-2">Gender</Text>
            <RadioButton.Group
              onValueChange={(value) => setGender(value)}
              value={gender}
            >
              <View className="flex-row space-x-4">
                <View className="flex-row items-center">
                  <RadioButton value="male" />
                  <Text>Male</Text>
                </View>
                <View className="flex-row items-center">
                  <RadioButton value="female" />
                  <Text>Female</Text>
                </View>
              </View>
            </RadioButton.Group>
          </View>

          {/* ====== User Type Selection ======= */}
          <View className="mt-4">
            <Text className="mb-2">I am a</Text>
            <RadioButton.Group
              onValueChange={(value) => setUserType(value)}
              value={userType}
            >
              <View className="flex-row space-x-4">
                <View className="flex-row items-center">
                  <RadioButton value="student" />
                  <Text>Student</Text>
                </View>
                <View className="flex-row items-center">
                  <RadioButton value="tutor" />
                  <Text>Tutor</Text>
                </View>
              </View>
            </RadioButton.Group>
          </View>

          {userType === 'tutor' && (
            <TextInput
              label="Rate per hour ($)"
              mode="outlined"
              keyboardType="numeric"
              onChangeText={(text) => (refRate.current = text)}
              className="mt-4"
            />
          )}

          {/* ====== Action buttons ======= */}
          <View className="mt-6 space-y-3">
            <Button
              mode="contained"
              onPress={handleSubmit}
              contentStyle={{ paddingVertical: 6 }}
              className="bg-blue-500"
            >
              Sign Up
            </Button>

            <View className="flex-row justify-center mt-2">
              <Text>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.push('/signin')}>
                <Text className="text-blue-600">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
