import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { provincesData } from '../../../assets/data/data';
import { FontAwesome5 } from '@expo/vector-icons';

const TutorProfile = ({ user }) => {
  // State management
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showAddGradeUI, setShowAddGradeUI] = useState(false);
  const [showAddSessionUI, setShowAddSessionUI] = useState(false);
  
  // Session form state
  const [newSession, setNewSession] = useState({
    subject: '',
    date: '',
    time: '',
    duration: 1,
    price: 0,
    status: 'available'
  });

  // Grade and subject data
  const gradesData = {
    'Grade 1-3': ['Arabic', 'Math', 'Science', 'Islamic Studies', 'English'],
    'Grade 4-6': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English'],
    'Grade 7-9': ['Arabic', 'Math', 'Science', 'Social Studies', 'Islamic Studies', 'English', 'History', 'Geography'],
    'Grade 10-12': ['Arabic', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Islamic Studies', 'English', 'Economics'],
  };

  // Fetch tutor data on component mount
  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        if (!user?.userID) {
          throw new Error('Invalid user data');
        }

        const docRef = doc(db, 'users', user.userID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tutorData = docSnap.data();
          processTutorData(tutorData);
        } else {
          throw new Error('Tutor profile not found');
        }
      } catch (error) {
        console.error('Error fetching tutor:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    const processTutorData = (tutorData) => {
      // Convert grade object to array if needed
      if (tutorData.grade && typeof tutorData.grade === 'object' && !Array.isArray(tutorData.grade)) {
        tutorData.grade = Object.entries(tutorData.grade).map(([grade, subjects]) => ({
          grade,
          subjects: Array.isArray(subjects) ? subjects : []
        }));
      }
      
      // Initialize empty arrays if they don't exist
      if (!tutorData.sessions) tutorData.sessions = [];
      
      // Set default price for new sessions
      if (tutorData.price) {
        setNewSession(prev => ({ ...prev, price: tutorData.price }));
      }
      
      setTutor(tutorData);
    };

    fetchTutorData();
  }, [user]);

  // Save profile data to Firestore
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.userID);
      
      // Convert grade array back to object for Firestore
      const gradeObject = {};
      if (tutor.grade) {
        tutor.grade.forEach(item => {
          gradeObject[item.grade] = item.subjects;
        });
      }
      
      await updateDoc(docRef, {
        ...tutor,
        grade: gradeObject,
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving tutor data:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Add a new session
  const handleAddSession = async () => {
    if (!newSession.subject || !newSession.date || !newSession.time) {
      Alert.alert('Error', 'Please fill all required session details');
      return;
    }

    try {
      setSaving(true);
      const sessionId = `session_${Date.now()}`;
      const sessionToAdd = {
        id: sessionId,
        subject: newSession.subject,
        date: newSession.date,
        time: newSession.time,
        duration: newSession.duration || 1,
        price: newSession.price || tutor.price || 0,
        status: 'available',
        createdAt: new Date().toISOString()
      };

      const tutorRef = doc(db, 'users', user.userID);
      await updateDoc(tutorRef, {
        sessions: arrayUnion(sessionToAdd)
      });

      // Update local state
      setTutor(prev => ({
        ...prev,
        sessions: [...(prev.sessions || []), sessionToAdd]
      }));

      // Reset form
      setNewSession({
        subject: '',
        date: '',
        time: '',
        duration: 1,
        price: tutor.price || 0,
        status: 'available'
      });
      setShowAddSessionUI(false);

      Alert.alert('Success', 'Session added successfully!');
    } catch (error) {
      console.error('Error adding session:', error);
      Alert.alert('Error', 'Failed to add session');
    } finally {
      setSaving(false);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId) => {
    try {
      setSaving(true);
      const tutorRef = doc(db, 'users', user.userID);
      
      // Find the session to remove
      const sessionToRemove = tutor.sessions.find(s => s.id === sessionId);
      if (!sessionToRemove) {
        throw new Error('Session not found');
      }

      await updateDoc(tutorRef, {
        sessions: arrayRemove(sessionToRemove)
      });

      // Update local state
      setTutor(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId)
      }));

      Alert.alert('Success', 'Session deleted successfully!');
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert('Error', error.message || 'Failed to delete session');
    } finally {
      setSaving(false);
    }
  };

  // Grade management functions
  const handleAddGrade = () => {
    if (!selectedGrade || selectedSubjects.length === 0) {
      Alert.alert('Error', 'Please select a grade and at least one subject');
      return;
    }

    const newGrade = [...(tutor.grade || []), { 
      grade: selectedGrade, 
      subjects: selectedSubjects 
    }];
    
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

  // Phone number validation
  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setTutor({ ...tutor, phoneNumber: cleanedText });
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  // Error state
  if (!tutor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load tutor information.</Text>
        <Button 
          title="Try Again" 
          onPress={() => window.location.reload()} 
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
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

      {/* Basic Information Section */}
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
            <Picker.Item label="Select Province" value="" />
            {provincesData.map((province, idx) => (
              <Picker.Item key={idx} label={province} value={province} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={tutor.description}
          onChangeText={(text) => setTutor({ ...tutor, description: text })}
          placeholder="About you and your teaching approach"
          multiline
          editable={!saving}
        />
      </View>

      {/* Grades and Subjects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grades and Subjects</Text>
          <TouchableOpacity 
            onPress={() => setShowAddGradeUI(!showAddGradeUI)}
            disabled={saving}
          >
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

      {/* Sessions Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tutoring Sessions</Text>
          <TouchableOpacity 
            onPress={() => setShowAddSessionUI(!showAddSessionUI)}
            disabled={saving}
          >
            <Text style={styles.addButton}>➕</Text>
          </TouchableOpacity>
        </View>

        {showAddSessionUI && (
          <View style={styles.sessionForm}>
            <TextInput
              style={styles.input}
              value={newSession.subject}
              onChangeText={(text) => setNewSession({...newSession, subject: text})}
              placeholder="Subject (e.g., Math, Physics)"
              editable={!saving}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={newSession.date}
                onChangeText={(text) => setNewSession({...newSession, date: text})}
                placeholder="Date (YYYY-MM-DD)"
                editable={!saving}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={newSession.time}
                onChangeText={(text) => setNewSession({...newSession, time: text})}
                placeholder="Time (HH:MM AM/PM)"
                editable={!saving}
              />
            </View>

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={String(newSession.duration)}
                onChangeText={(text) => setNewSession({
                  ...newSession, 
                  duration: Math.max(1, Number(text) || 1)
                })}
                placeholder="Duration (hours)"
                keyboardType="numeric"
                editable={!saving}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={String(newSession.price)}
                onChangeText={(text) => setNewSession({
                  ...newSession, 
                  price: Math.max(0, Number(text) || 0)
                })}
                placeholder="Price (SAR)"
                keyboardType="numeric"
                editable={!saving}
              />
            </View>

            <Button 
              title="Add Session" 
              onPress={handleAddSession} 
              disabled={
                !newSession.subject || 
                !newSession.date || 
                !newSession.time || 
                saving
              }
            />
          </View>
        )}

        {tutor.sessions?.length > 0 ? (
          tutor.sessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionTitle}>{session.subject}</Text>
                <Text>Date: {session.date}</Text>
                <Text>Time: {session.time} ({session.duration} hour{session.duration !== 1 ? 's' : ''})</Text>
                <Text>Price: {session.price} SAR</Text>
                <Text>Status: {session.status}</Text>
              </View>
              <Button 
                title="Delete" 
                onPress={() => handleDeleteSession(session.id)} 
                color="#FF3B30"
                disabled={saving}
              />
            </View>
          ))
        ) : (
          <Text style={styles.noSessionsText}>No sessions created yet</Text>
        )}
      </View>

      {/* Pricing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <TextInput
          style={styles.input}
          value={String(tutor.price)}
          onChangeText={(text) => setTutor({ 
            ...tutor, 
            price: Math.max(0, Number(text) || 0)
          })}
          placeholder="Default hourly rate (SAR)"
          keyboardType="numeric"
          editable={!saving}
        />
      </View>

      {/* Display Reviews */}
      <View style={styles.reviewList}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {tutor.reviews?.length > 0 ? (
          tutor.reviews.map((r, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.reviewRating}>⭐ {r.rating}/5</Text>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))
        ) : (
          <Text>No reviews yet.</Text>
        )}
      </View>
      {/* Average Rating */}
      {tutor.reviews?.length > 0 && (
        <View style={styles.averageRatingContainer}>
          <Text style={styles.averageRatingLabel}>Rating:</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => {
              const avgRating =
                tutor.reviews.reduce((sum, r) => sum + Number(r.rating), 0) /
                tutor.reviews.length;
              return (
                <Text key={i} style={styles.star}>
                  {i < Math.floor(avgRating) ? '★' : '☆'}
                </Text>
              );
            })}
          </View>
        </View>
      )}
      {/* Save Button */}
      <Button 
        title={saving ? "Saving..." : "Save All Changes"} 
        onPress={handleSaveProfile} 
        disabled={saving}
        style={styles.saveButton}
        mode="contained"
      />
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  gradeItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  gradeTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  addButton: {
    fontSize: 24,
    color: '#007AFF',
  },
  addGradeContainer: {
    marginTop: 10,
  },
  gradesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  gradeButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
  },
  selectedGradeButton: {
    backgroundColor: '#D0E3FF',
  },
  gradeButtonText: {
    fontSize: 14,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  subjectItem: {
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    margin: 5,
  },
  selectedSubject: {
    backgroundColor: '#D0E3FF',
  },
  sessionForm: {
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  noSessionsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },

reviewList: {
  borderTopWidth: 1,
  borderTopColor: '#ccc',
  paddingTop: 10,
},

reviewItem: {
  marginBottom: 10,
  backgroundColor: '#f5f5f5',
  padding: 10,
  borderRadius: 8,
},

reviewRating: {
  fontWeight: 'bold',
  marginBottom: 4,
},

reviewComment: {
  marginBottom: 4,
},
averageRatingContainer: {
  marginBottom: 12,
  padding: 10,
  backgroundColor: '#f9f9f9',
  borderRadius: 8,
  alignItems: 'flex-start',
},
averageRatingLabel: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 4,
  color: '#333',
},
starsRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
star: {
  fontSize: 45,
  color: '#f5a623', // golden color
  marginRight: 2,
},
avgValueText: {
  fontSize: 16,
  marginLeft: 8,
  color: '#555',
},

});

export default TutorProfile;