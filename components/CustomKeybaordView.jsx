import React from 'react';
import { Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

const ios = Platform.OS === 'ios';
function CustomKeybaordView({ children }) {
  return (
    <KeyboardAvoidingView behavior={ios ? 'padding' : 'height'}>
      <ScrollView bounces={false}>{children}</ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CustomKeybaordView;
