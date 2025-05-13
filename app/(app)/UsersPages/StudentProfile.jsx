import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // <--- ADD this!
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { provincesData } from '../../../assets/data/data';
import { FontAwesome5 } from '@expo/vector-icons';

const StudentProfile = ({ user }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (!user || !user.userID) {
          console.error('Invalid user object:', user);
          return;
        }

        const docRef = doc(db, 'users', user.userID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const studentData = docSnap.data();
          if (!Array.isArray(studentData.sessionsRegistered)) {
            studentData.sessionsRegistered = [];
          }
          setStudent(studentData);
        } else {
          console.log('No such student!');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.userID);
      await updateDoc(docRef, student);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving student data:', error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setStudent({ ...student, phoneNumber: cleanedText });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <Text>Could not load student information.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImagePlaceholder}>
                   <FontAwesome5 
                    name={student.gender === 'female' ? 'user-alt' : 'user'} 
                    size={60} 
                    color="#555" 
                   />
                </View>
              <Text style={styles.title}>Student Profile</Text>
            </View>

      {/* General Info */}
      <TextInput
        style={styles.input}
        value={student.name}
        onChangeText={(text) => setStudent({ ...student, name: text })}
        placeholder="Name"
      />

      <TextInput
        style={styles.input}
        value={student.email}
        editable={false}
        placeholder="Email"
      />

      <TextInput
        style={styles.input}
        value={student.phoneNumber}
        onChangeText={handlePhoneNumberChange}
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />

      {/* Province Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={student.province}
          onValueChange={(value) => setStudent({ ...student, province: value })}
        >
          <Picker.Item label="Select Province" value="" />
          {provincesData.map((province, idx) => (
            <Picker.Item key={idx} label={province} value={province} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={student.description}
        onChangeText={(text) => setStudent({ ...student, description: text })}
        placeholder="Description"
        multiline
      />

      {/* Sessions Registered */}
      <Text style={styles.subtitle}>Sessions Registered</Text>
      {student.sessionsRegistered.length === 0 ? (
        <Text>No sessions registered yet.</Text>
      ) : (
        student.sessionsRegistered.map((session, idx) => (
          <View key={idx} style={styles.sessionItem}>
            <Text>Session {idx + 1}: {session}</Text>
          </View>
        ))
      )}

      {/* Save Button */}
      <Button title={saving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
};

export default StudentProfile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 15,
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sessionItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
});
