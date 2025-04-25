import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import SearchAndFilter from '../../../components/SearchAndFilter';
import { fetchTutors, fetchEnrolledStudents, fetchUpcomingSessions } from './SharedHomeUtils';

const TutorHomePage = () => {
  const { logout, user } = useAuth();
  const [alltutors, setallTutors] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const renderTutorProfile = () => {
    if (!selectedTutor) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.title}>{selectedTutor.name}'s Profile</Text>
        <Text>Available Sessions:</Text>

        {Array.isArray(selectedTutor.sessions) ? (
          selectedTutor.sessions.map((session, idx) => (
            <Text key={idx}>- {session}</Text>
          ))
        ) : (
          <Text>No sessions available</Text>
        )}

        <Button onPress={() => setSelectedTutor(null)} mode="outlined" style={styles.backButton}>
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
        <Text>Subjects enrolled with you:</Text>
        {selectedStudent.subjects.map((subj, index) => (
          <Text key={index}>- {subj}</Text>
        ))}
        <Text style={{ marginTop: 10 }}>Sessions:</Text>
        {selectedStudent.sessions.map((session, index) => (
          <Text key={index}>
            - {session.subject}: {session.time}
          </Text>
        ))}
        <Button onPress={() => setSelectedStudent(null)} mode="outlined" style={styles.backButton}>
          Back to Students
        </Button>
      </View>
    );
  };

  useEffect(() => {
    if (user != null) {
      fetchTutors().then(setallTutors);
      fetchEnrolledStudents(user.id).then(setStudents);
      fetchUpcomingSessions(user.id).then(setUpcomingSessions);
    }
  }, [user]);

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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome Student</Text>
        <Button onPress={logout} mode="contained" style={styles.logoutButton}>
          Logout
        </Button>
  
        <SearchAndFilter tutorsData={alltutors} onResultsFiltered={setTutors} />
  
        <Text style={styles.subHeader}>Tutors near you ({user.province}):</Text>
        {tutors.length > 0 ? (
          tutors.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => setSelectedTutor(item)}>
              <Card style={styles.card}>
                <Card.Title title={item.name} subtitle={`Province: ${item.province}`} />
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No tutors found in your area.</Text>
        )}
  
        <View style={styles.section}>
          <Text style={styles.subHeader}>Closest Upcoming Sessions:</Text>
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <Text key={session.id}>
                {session.time} with {session.tutor}
              </Text>
            ))
          ) : (
            <Text>No upcoming sessions.</Text>
          )}
        </View>
  
        <View style={styles.section}>
          <Text style={styles.subHeader}>Your Students:</Text>
          {students.length > 0 ? (
            students.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => setSelectedStudent(item)}>
                <Card style={styles.card}>
                  <Card.Title
                    title={item.name}
                    subtitle={`Subjects: ${item.subjects.join(', ')}`}
                  />
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

export default TutorHomePage;

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
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
});
