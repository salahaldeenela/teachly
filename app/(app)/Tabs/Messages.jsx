import React, { useEffect, useState, useRef } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../context/authContext';
import { View, Text } from 'react-native';
import ChatroomList from '../../../components/ChatroomList';

const Messages = () => {
  const { user } = useAuth();
  const [otherUsers, setOtherUsers] = useState([]);

  // Ref to store the unsubscribe function for Firestore
  const unsubscribeRef = useRef(null);

  // Function to set up Firestore listeners
  const setupListeners = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    if (!user?.userID) return;

    unsubscribeRef.current = onSnapshot(
      collection(db, 'rooms'),
      async (snapshot) => {
        const unsubscribes = [];
        const userMap = new Map();

        for (const roomDoc of snapshot.docs) {
          const roomId = roomDoc.id;
          const [userId1, userId2] = roomId.split('-');

          if (userId1 === user.userID || userId2 === user.userID) {
            const otherUserId = userId1 === user.userID ? userId2 : userId1;
            const userDocRef = doc(db, 'users', otherUserId);

            const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
              if (userSnap.exists()) {
                const userInfo = userSnap.data();
                userMap.set(otherUserId, userInfo);
                setOtherUsers(Array.from(userMap.values()));
              }
            });

            unsubscribes.push(unsubscribeUser);
          }
        }

        // Clean up user listeners when rooms change
        return () => unsubscribes.forEach((unsub) => unsub());
      },
    );
  };

  useEffect(() => {
    setupListeners();

    // Refresh every 5 seconds
    const intervalId = setInterval(() => {
      setupListeners();
    }, 5000);

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearInterval(intervalId);
    };
  }, [user?.userID]);

  return (
    <View>
      {otherUsers.length > 0 ? (
        <ChatroomList users={otherUsers} />
      ) : (
        <Text>No messages</Text>
      )}
    </View>
  );
};

export default Messages;
