import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { provincesData } from '../../../assets/data/data';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../../context/authContext';


const TutorProfile = ({ user }) => {
  const { logout } = useAuth();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showAddGradeUI, setShowAddGradeUI] = useState(false);

  const gradesData = {
    'Grade 1-3': ['Arabic', 'Math', 'Science', 'Islamic Studies', 'English'],
    'Grade 4-6': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English'],
    'Grade 7-9': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English', 'History', 'Geography'],
    'Grade 10-12': ['Arabic', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Islamic Studies', 'English', 'Economics'],
  };

  const fetchTutorData = async () => {
    try {
      if (!user?.userID) throw new Error('Invalid user data');
      const docRef = doc(db, 'users', user.userID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const tutorData = docSnap.data();
        if (tutorData.grade && typeof tutorData.grade === 'object' && !Array.isArray(tutorData.grade)) {
          tutorData.grade = Object.entries(tutorData.grade).map(([grade, subjects]) => ({
            grade,
            subjects: Array.isArray(subjects) ? subjects : []
          }));
        }
        setTutor(tutorData);
      } else {
        throw new Error('Tutor profile not found');
      }
    } catch (error) {
      console.error('Error fetching tutor:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTutorData();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTutorData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.userID);
      const gradeObject = {};
      if (tutor.grade) {
        tutor.grade.forEach(item => {
          gradeObject[item.grade] = item.subjects;
        });
      }
      await updateDoc(docRef, { ...tutor, grade: gradeObject });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving tutor data:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGrade = () => {
    if (!selectedGrade || selectedSubjects.length === 0) {
      Alert.alert('Error', 'Please select a grade and at least one subject');
      return;
    }
    const newGrade = [...(tutor.grade || []), { grade: selectedGrade, subjects: selectedSubjects }];
    setTutor({ ...tutor, grade: newGrade });
    setSelectedGrade('');
    setSelectedSubjects([]);
    setShowAddGradeUI(false);
  };

  const handleDeleteGrade = (gradeToDelete) => {
    const updatedGrade = tutor.grade.filter(g => g.grade !== gradeToDelete);
    setTutor({ ...tutor, grade: updatedGrade });
  };

  const handleToggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setTutor({ ...tutor, phoneNumber: cleanedText });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load tutor information.</Text>
        <Button title="Try Again" onPress={fetchTutorData} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileImagePlaceholder}>
          <FontAwesome5 
            name={tutor.gender === 'female' ? 'user-alt' : 'user'} 
            size={60} 
            color="#555" 
          />
        </View>
        <Text style={styles.title}>Tutor Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <TextInput
          style={styles.input}
          value={tutor.name}
          onChangeText={(text) => setTutor({ ...tutor, name: text })}
          placeholder="Full Name"
          editable={!saving}
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
          editable={!saving}
          maxLength={10}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tutor.province}
            onValueChange={(value) => setTutor({ ...tutor, province: value })}
            enabled={!saving}
          >
            {provincesData.map((province, idx) => (
              <Picker.Item key={idx} label={province} value={province} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={tutor.experince}
          onChangeText={(text) => setTutor({ ...tutor, experince: text })}
          placeholder="Your Experience"
          multiline
          editable={!saving}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grades and Subjects</Text>
          <TouchableOpacity onPress={() => setShowAddGradeUI(!showAddGradeUI)} disabled={saving}>
            <Text style={styles.addButton}>➕</Text>
          </TouchableOpacity>
        </View>

        {tutor.grade?.map((g, idx) => (
          <View key={idx} style={styles.gradeItem}>
            <Text style={styles.gradeTitle}>{g.grade}</Text>
            <Text>Subjects: {g.subjects?.join(', ') || 'None'}</Text>
            <Button 
              title="Remove Grade" 
              onPress={() => handleDeleteGrade(g.grade)} 
              color="#FF3B30"
              disabled={saving}
            />
          </View>
        ))}

        {showAddGradeUI && (
          <View style={styles.addGradeContainer}>
            <Text style={styles.subtitle}>Add New Grade Level</Text>
            <View style={styles.gradesList}>
              {Object.keys(gradesData).map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeButton,
                    selectedGrade === grade && styles.selectedGradeButton
                  ]}
                  onPress={() => {
                    setSelectedGrade(grade);
                    setSelectedSubjects([]);
                  }}
                  disabled={saving}
                >
                  <Text style={styles.gradeButtonText}>{grade}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedGrade && (
              <>
                <Text style={styles.subtitle}>Select Subjects for {selectedGrade}</Text>
                <View style={styles.subjectsList}>
                  {gradesData[selectedGrade].map((subject) => (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.subjectItem,
                        selectedSubjects.includes(subject) && styles.selectedSubject
                      ]}
                      onPress={() => handleToggleSubject(subject)}
                      disabled={saving}
                    >
                      <Text>{subject}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button 
                  title="Add Grade Level" 
                  onPress={handleAddGrade} 
                  disabled={!selectedGrade || selectedSubjects.length === 0 || saving}
                />
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.reviewList}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {tutor.reviews?.length > 0 ? (
          tutor.reviews.map((r, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.reviewUser}>{r.userName || 'Anonymous'}</Text>
              <Text style={styles.reviewRating}>⭐ {r.rating}/5</Text>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))
        ) : (
          <Text>No reviews yet.</Text>
        )}
      </View>


      {tutor.reviews?.length > 0 && (
        <View style={styles.averageRatingContainer}>
          <Text style={styles.averageRatingLabel}>Your Rating</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => {
              const avgRating =
                tutor.reviews.reduce((sum, r) => sum + Number(r.rating), 0) /
                tutor.reviews.length;
              return (
                <Text key={i} style={i < Math.floor(avgRating) ? styles.filledStar : styles.emptyStar}>
                  {i < Math.floor(avgRating) ? '★' : '☆'}
                </Text>
              );
            })}
          </View>
        </View>
      )}


      <Button 
        title={saving ? "Saving..." : "Save All Changes"} 
        onPress={handleSaveProfile} 
        disabled={saving}
        style={styles.saveButton}
      />
      <View style={{ marginTop: 20 }}>
        <Button
          title="Logout"
          onPress={logout}
          color="#FF3B30"
        />
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', marginBottom: 10 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 },
  descriptionInput: { height: 80 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addButton: { fontSize: 24 },
  gradeItem: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  gradeTitle: { fontWeight: 'bold' },
  addGradeContainer: { padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  subtitle: { fontWeight: 'bold', marginVertical: 10 },
  gradesList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  gradeButton: { padding: 8, borderWidth: 1, borderRadius: 6, marginRight: 10, marginBottom: 10 },
  selectedGradeButton: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  gradeButtonText: { color: '#000' },
  subjectsList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  subjectItem: { padding: 6, borderWidth: 1, borderRadius: 6, margin: 5 },
  selectedSubject: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  reviewList: { marginBottom: 30 },
  reviewItem: { marginBottom: 10 },
  reviewRating: { fontWeight: 'bold' },
  reviewComment: { fontStyle: 'italic' },
  averageRatingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  averageRatingLabel: { marginRight: 10,fontSize: 16, fontWeight: 'bold' },
  starsRow: { flexDirection: 'row' },
  star: { fontSize: 20, marginRight: 4 },
  saveButton: { marginTop: 20 },
  logoutButton: {
    marginBottom: 20,
  },
  reviewUser: {
    fontWeight: 'bold',
    marginBottom: 2,
  },

  filledStar: {
    color: 'gold',
    fontSize: 40,
    marginHorizontal: 1,
  },

  emptyStar: {
    color: '#ccc',
    fontSize: 40,
    marginHorizontal: 1,
  },

});

export default TutorProfile;
