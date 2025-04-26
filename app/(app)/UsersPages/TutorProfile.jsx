import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TutorProfile = ({ user }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tutor Profile</Text>
      <Text>Name: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Subjects: {user.subjects?.join(', ')}</Text>
      {/* Add more tutor-specific info here */}
    </View>
  );
};

export default TutorProfile;

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
