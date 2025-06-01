import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import SearchAndFilter from '../../../components/SearchAndFilter';
import { fetchTutors, fetchEnrolledStudents } from './SharedHomeUtils';

const TutorHomePage = () => {
  const { logout, user } = useAuth();
  const [allTutors, setAllTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setTutorsLoading(true);
      setStudentsLoading(true);

      const tutorsData = await fetchTutors();
      setAllTutors(tutorsData);
      setFilteredTutors(tutorsData);

      const enrolledStudents = await fetchEnrolledStudents(user.userID);
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setTutorsLoading(false);
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  const getSubjectsFromTutor = (tutor) => {
    if (!tutor?.grade) return "No subjects listed";
    try {
      let grades = tutor.grade;
      if (!Array.isArray(grades)) {
        grades = Object.entries(grades).map(([grade, subjects]) => ({
          grade,
          subjects: Array.isArray(subjects) ? subjects : [],
        }));
      }
      const allSubjects = grades.flatMap(g => g.subjects || []);
      return allSubjects.length > 0 ? allSubjects.join(', ') : "No subjects listed";
    } catch (error) {
      console.error("Error processing subjects:", error);
      return "Error loading subjects";
    }
  };

  const renderTutorProfile = () => {
    if (!selectedTutor) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.title}>{selectedTutor.name}'s Profile</Text>
        <Text>Gender: {selectedTutor.gender || 'Not specified'}</Text>
        <Text>Subjects: {getSubjectsFromTutor(selectedTutor)}</Text>
        <Text>Province: {selectedTutor.province || 'Not specified'}</Text>
        <Text>Experince: {selectedTutor.experince || 'Not specified'}</Text>

        <Text style={styles.subHeader}>Available Sessions:</Text>
        {selectedTutor.sessions?.length > 0 ? (
          selectedTutor.sessions.map((session, idx) => (
            <Card key={idx} style={styles.sessionCard}>
              <Card.Content>
                <Text style={styles.sessionTitle}>{session.subject || 'No subject'}</Text>
                <Text>Date: {session.date || 'Not specified'}</Text>
                <Text>Time: {session.time || 'Not specified'}</Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text>No sessions available</Text>
        )}

        <Button
          onPress={() => setSelectedTutor(null)}
          mode="outlined"
          style={styles.backButton}
        >
          Back to Tutors
        </Button>
      </View>
    );
  };

  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.title}>{selectedStudent.name}'s Details</Text>
        <Text>Contact: {selectedStudent.email || selectedStudent.phone || 'No contact info'}</Text>

        <Text style={styles.subHeader}>Subjects enrolled with you:</Text>
        {selectedStudent.subjects?.length > 0 ? (
          selectedStudent.subjects.map((subj, index) => (
            <Text key={index}>- {subj}</Text>
          ))
        ) : (
          <Text>No subjects enrolled</Text>
        )}

        <Text style={[styles.subHeader, { marginTop: 10 }]}>Scheduled Sessions:</Text>
        {selectedStudent.sessions?.length > 0 ? (
          selectedStudent.sessions.map((session, index) => (
            <Card key={index} style={styles.sessionCard}>
              <Card.Content>
                <Text style={styles.sessionTitle}>{session.subject || 'No subject'}</Text>
                <Text>When: {session.time || 'Time not specified'}</Text>
                {session.date && (
                  <Text>Date: {session.date.toLocaleDateString()}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text>No upcoming sessions</Text>
        )}

        <Button
          onPress={() => setSelectedStudent(null)}
          mode="outlined"
          style={styles.backButton}
        >
          Back to Students
        </Button>
      </View>
    );
  };

  if (selectedTutor) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>{renderTutorProfile()}</View>
      </ScrollView>
    );
  }

  if (selectedStudent) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>{renderStudentDetails()}</View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Welcome {user?.username || 'Tutor'}</Text>
        <Button onPress={logout} mode="contained" style={styles.logoutButton}>
          Logout
        </Button>

        <SearchAndFilter tutorsData={allTutors} onResultsFiltered={setFilteredTutors} />

        <Text style={styles.subHeader}>Explore Tutors</Text>
        {tutorsLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : filteredTutors.length > 0 ? (
          filteredTutors.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedTutor(item)}
              disabled={loading}
            >
              <Card style={styles.card}>
                <Card.Title
                  title={item.name || 'No name'}
                  subtitle={`${item.province || 'Location not specified'} `}
                />
                <Card.Content>
                  <Text>Teaches: {getSubjectsFromTutor(item)}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No tutors found in your area.</Text>
        )}

        <View style={styles.section}>
          <Text style={styles.subHeader}>Your Students:</Text>
          {studentsLoading ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : students.length > 0 ? (
            students.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedStudent(item)}
                disabled={loading}
              >
                <Card style={styles.card}>
                  <Card.Title
                    title={item.name || 'No name'}
                    subtitle={`Subjects: ${item.subjects?.join(', ') || 'None'}`}
                  />
                  <Card.Content>
                    <Text>Sessions: {item.sessions?.length || 0}</Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Text>No students enrolled yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  card: {
    marginBottom: 10,
    padding: 10,
  },
  section: {
    marginTop: 20,
  },
  logoutButton: {
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  sessionCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  loader: {
    marginVertical: 20,
  },
});

export default TutorHomePage;
