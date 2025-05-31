import React from 'react';
import { View, Text } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const MessageItem = ({ message, currentUser }) => {
  const isSender = currentUser?.userID === message?.userID;

  if (isSender) {
    return (
      <View className="flex-row justify-end mb-3 mr-2">
        <View style={{ width: wp(80) }}>
          <View className="flex self-end p-5 bg-white border border-neutral-200 rounded-2xl">
            <Text style={{ height: hp(4) }}>{message?.text}</Text>
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View className="flex-row justify-start mb-3">
        <View style={{ width: wp(80) }}>
          <View
            className="flex self-start p-3 bg-indigo-100 border border-indigo-200 rounded-2xl"
            style={{ marginLeft: wp(5) }}
          >
            <Text style={{ height: hp(4) }}>{message?.text}</Text>
          </View>
        </View>
      </View>
    );
  }
};

export default MessageItem;
