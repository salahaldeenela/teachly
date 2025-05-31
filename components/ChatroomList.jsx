import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ChatroomItem from './ChatroomItem';

const ChatroomList = ({ users }) => {
  const router = useRouter();

  const handlePress = (user) => {
    console.log(users);
    router.push({
      pathname: '/UsersPages/ChatScreen',
      params: {
        userID: user.userID,
        name: user.name, // <-- pass the name here
      },
    });
  };

  return (
    <View>
      {users.map((user, index) => (
        <TouchableOpacity
          key={user.userID || index}
          onPress={() => handlePress(user)}
          activeOpacity={0.7}
        >
          <ChatroomItem user={user} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ChatroomList;
