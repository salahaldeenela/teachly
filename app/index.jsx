import React from 'react';
import { View, ActivityIndicator } from 'react-native';

function StartPage() {
  return (
    <View className="justify-center flex-1">
      <ActivityIndicator size="large" />
    </View>
  );
}

export default StartPage;
