import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StudentProfile = ({ user }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Profile</Text>
      <Text>Name: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      {/* Add more student-specific info here */}
    </View>
  );
};

export default StudentProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
