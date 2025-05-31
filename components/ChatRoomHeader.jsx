import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ChatScreen = () => {
  const { userID, name } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-300">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-sharp" size={hp(4)} />
        </TouchableOpacity>
        <Text className="text-lg font-bold">{name || 'Chat'}</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity>
            <Ionicons name="call" size={hp(4)} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="videocam" size={hp(4)} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <View className="items-center justify-center flex-1"></View>
    </View>
  );
};

export default ChatScreen;
