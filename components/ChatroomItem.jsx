import React from 'react';
import { View, Text } from 'react-native';

const ChatroomItem = ({ user }) => {
  return (
    <View className="px-4 py-3 border-b border-gray-200">
      <Text className="text-base text-black">{user.name}</Text>
    </View>
  );
};

export default ChatroomItem;
