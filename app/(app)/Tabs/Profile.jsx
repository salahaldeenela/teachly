import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../../context/authContext';
import StudentProfile from '../UsersPages/StudentProfile';
import TutorProfile from '../UsersPages/TutorProfile';

const Profile = () => {
  const { user } = useAuth();


  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  if (user.userType === 'student') {
    return <StudentProfile user={user} />;
  }

  if (user.userType === 'tutor') {
    return <TutorProfile user={user} />;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.text}>User type not recognized.</Text>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
});
