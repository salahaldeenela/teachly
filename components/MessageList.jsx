import React from 'react';
import { ScrollView } from 'react-native';
import MessageItem from './MessageItem';

const MessageList = ({ messages, currentUser }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: 10 }}>
      {messages.map((message, index) => (
        <MessageItem message={message} key={index} currentUser={currentUser} />
      ))}
    </ScrollView>
  );
};

export default MessageList;
