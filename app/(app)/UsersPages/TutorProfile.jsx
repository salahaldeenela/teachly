import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { provincesData } from '../../../assets/data/data';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import * as ImagePicker from 'expo-image-picker';

const TutorProfile = ({ user }) => {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showAddGradeUI, setShowAddGradeUI] = useState(false);

  const gradesData = {
    'Grade 1-3': ['Arabic', 'Math', 'Science', 'Islamic Studies', 'English'],
    'Grade 4-6': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English'],
    'Grade 7-9': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English', 'History', 'Geography'],
    'Grade 10-12': ['Arabic', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Islamic Studies', 'English', 'Economics'],
  };

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        if (!user || !user.userID) {
          console.error('Invalid user object:', user);
          return;
        }

        const docRef = doc(db, 'users', user.userID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tutorData = docSnap.data();
          if (!Array.isArray(tutorData.teaching)) {
            tutorData.teaching = [];
          }
          setTutor(tutorData);
        } else {
          console.log('No such tutor!');
        }
      } catch (error) {
        console.error('Error fetching tutor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutor();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.userID);
      await updateDoc(docRef, tutor);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving tutor data:', error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGrade = () => {
    if (!selectedGrade || selectedSubjects.length === 0) {
      alert('Please select a grade and at least one subject.');
      return;
    }

    const newTeaching = [...tutor.teaching, { grade: selectedGrade, subjects: selectedSubjects }];
    setTutor({ ...tutor, teaching: newTeaching });

    setSelectedGrade('');
    setSelectedSubjects([]);
    setShowAddGradeUI(false);
  };

  const handleDeleteGrade = (gradeToDelete) => {
    const updatedTeaching = tutor.teaching.filter(g => g.grade !== gradeToDelete);
    setTutor({ ...tutor, teaching: updatedTeaching });
  };

  const handleToggleSubject = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleImagePick = async () => {
    // Keep your ImagePicker logic here
  };

  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setTutor({ ...tutor, phoneNumber: cleanedText });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={styles.container}>
        <Text>Could not load tutor information.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <TouchableOpacity onPress={handleImagePick}>
        {tutor.profilePicture ? (
          <Image source={{ uri: tutor.profilePicture }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text>Upload Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.title}>Tutor Profile</Text>

      {/* General Info */}
      <TextInput
        style={styles.input}
        value={tutor.name}
        onChangeText={(text) => setTutor({ ...tutor, name: text })}
        placeholder="Name"
      />

      <TextInput
        style={styles.input}
        value={tutor.email}
        editable={false}
        placeholder="Email"
      />

      <TextInput
        style={styles.input}
        value={tutor.phoneNumber}
        onChangeText={handlePhoneNumberChange}
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />

      {/* Province Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tutor.province}
                onValueChange={(value) => setTutor({ ...tutor, province: value })}>
                <Picker.Item label="Select Province" value="" />
                {provincesData.map((province, idx) => (
                  <Picker.Item key={idx} label={province} value={province} />
                ))}
              </Picker>
            </View>
      
      {/* Teaching Grades and Subjects */}
      <View style={styles.gradesHeader}>
        <Text style={styles.subtitle}>Grades and Subjects</Text>
        <TouchableOpacity onPress={() => setShowAddGradeUI(!showAddGradeUI)}>
          <Text style={styles.addButton}>➕</Text>
        </TouchableOpacity>
      </View>

      {tutor.teaching.map((g, idx) => (
        <View key={idx} style={styles.gradeItem}>
          <Text style={styles.gradeTitle}>{g.grade}</Text>
          <Text>Subjects: {g.subjects.join(', ')}</Text>
          <Button title="Delete Grade" onPress={() => handleDeleteGrade(g.grade)} color="red" />
        </View>
      ))}

      {/* Add Grade UI (appears when pressing ➕) */}
      {showAddGradeUI && (
        <>
          <Text style={styles.subtitle}>Add New Grade</Text>

          <View style={styles.gradesList}>
            {Object.keys(gradesData).map((grade, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.gradeButton,
                  selectedGrade === grade && styles.selectedGradeButton
                ]}
                onPress={() => {
                  setSelectedGrade(grade);
                  setSelectedSubjects([]);
                }}
              >
                <Text style={styles.gradeButtonText}>{grade}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedGrade && (
            <>
              <Text style={styles.subtitle}>Select Subjects for {selectedGrade}</Text>
              <View style={styles.subjectsList}>
                {gradesData[selectedGrade].map((subject, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.subjectItem,
                      selectedSubjects.includes(subject) && styles.selectedSubject
                    ]}
                    onPress={() => handleToggleSubject(subject)}
                  >
                    <Text>{subject}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Button title="Add Grade" onPress={handleAddGrade} />
        </>
      )}

      {/* Other Profile Details */}
      
      <TextInput
        style={styles.input}
        value={tutor.gender}
        onChangeText={(text) => setTutor({ ...tutor, gender: text })}
        placeholder="Gender"
      />

      <TextInput
        style={styles.input}
        value={String(tutor.price)}
        onChangeText={(text) => setTutor({ ...tutor, price: Number(text) })}
        placeholder="Price per Hour"
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={tutor.description}
        onChangeText={(text) => setTutor({ ...tutor, description: text })}
        placeholder="Description"
        multiline
      />

      {/* Save Button */}
      <Button title={saving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
};

export default TutorProfile;

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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
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
  gradeItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  gradeTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gradesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    fontSize: 24,
    color: '#007bff',
  },
  gradesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gradeButton: {
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 5,
  },
  selectedGradeButton: {
    backgroundColor: '#add8e6',
  },
  gradeButtonText: {
    fontSize: 14,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  subjectItem: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    margin: 4,
  },
  selectedSubject: {
    backgroundColor: '#add8e6',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
});
