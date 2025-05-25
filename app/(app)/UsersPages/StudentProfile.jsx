import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
        if (!user?.userID) {
          throw new Error('Invalid user object');
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
          throw new Error('Student profile not found');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        Alert.alert('Error', 'Failed to load profile data');
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
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving student data:', error);
      Alert.alert('Error', 'Failed to update profile.');
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centered}>
        <Text>Could not load student information.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImage}>
          <FontAwesome5
            name={student.gender === 'female' ? 'user-alt' : 'user'}
            size={60}
            color="#555"
          />
        </View>
        <Text style={styles.title}>Student Profile</Text>
      </View>

      {/* General Info */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={student.name}
        onChangeText={(text) => setStudent({ ...student, name: text })}
        placeholder="Name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={student.email}
        editable={false}
        placeholder="Email"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={student.phoneNumber}
        onChangeText={handlePhoneNumberChange}
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Province</Text>
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

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={student.description}
        onChangeText={(text) => setStudent({ ...student, description: text })}
        placeholder="Description"
        multiline
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default StudentProfile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  sessionItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  textMuted: {
    color: '#666',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
});
