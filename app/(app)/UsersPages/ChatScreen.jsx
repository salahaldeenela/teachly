import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { getRoomId } from '../../../assets/data/data';
import MessageList from '../../../components/MessageList'; // adjust if path is different

const ChatScreen = () => {
  const { userID, name } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const inputRef = useRef(null);
  const textRef = useRef('');
  const [messages, setMessages] = useState([]);

  const roomId = getRoomId(user?.userID, userID);

  useEffect(() => {
    const docRef = doc(db, 'rooms', roomId);
    const messagesRef = collection(docRef, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [roomId]);

  const handleSendMessage = async () => {
    let message = textRef.current.trim();
    if (!message) return;

    try {
      const docRef = doc(db, 'rooms', roomId);
      const messagesRef = collection(docRef, 'messages');

      await addDoc(messagesRef, {
        userID: user?.userID,
        text: message,
        senderName: user?.username,
        createdAt: Timestamp.fromDate(new Date()),
      });

      textRef.current = '';
      if (inputRef.current) inputRef.current.clear();
    } catch (e) {
      console.log('Error sending message:', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={hp(8)}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-sharp" size={hp(3.5)} color="#333" />
          </TouchableOpacity>

          <Text className="text-lg font-bold text-gray-800">
            {name || 'Chat'}
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
              <Ionicons name="call" size={hp(3)} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
              <Ionicons name="videocam" size={hp(3)} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message List */}
        <View className="flex-1 px-2 py-2">
          <MessageList messages={messages} currentUser={user} />
        </View>

        {/* Message Input */}
        <View style={{ marginBottom: hp(1) }} className="px-3 pt-2">
          <View className="flex-row items-center justify-between p-2 bg-white border border-gray-300 rounded-full shadow-sm">
            <TextInput
              ref={inputRef}
              onChangeText={(value) => (textRef.current = value)}
              className="flex-1 mr-2 text-base text-gray-800"
              style={{ fontSize: hp(2.2) }}
              placeholder="Type your message..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              className="p-3 bg-blue-500 rounded-full"
            >
              <Feather name="send" size={hp(2.5)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
