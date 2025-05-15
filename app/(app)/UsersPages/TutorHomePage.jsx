import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import SearchAndFilter from '../../../components/SearchAndFilter';
import { fetchTutors, fetchEnrolledStudents, fetchTutorSessions } from './SharedHomeUtils';

const TutorHomePage = () => {
  const { logout, user } = useAuth();
  const [allTutors, setAllTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setTutorsLoading(true);
        setStudentsLoading(true);
        setSessionsLoading(true);

        // Load all tutors data
        const tutorsData = await fetchTutors();
        setAllTutors(tutorsData);
        setFilteredTutors(tutorsData);
        
        // Load enrolled students
        const enrolledStudents = await fetchEnrolledStudents(user.userID);
        setStudents(enrolledStudents);
        
        console.log(user);
        // Load upcoming sessions
        const sessions = await fetchTutorSessions(user.userID);
        setUpcomingSessions(sessions);
        
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
        setTutorsLoading(false);
        setStudentsLoading(false);
        setSessionsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const renderTutorProfile = () => {
    if (!selectedTutor) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.title}>{selectedTutor.name}'s Profile</Text>
        <Text>Subjects: {getSubjectsFromTutor(selectedTutor)}</Text>
        <Text>Price: {selectedTutor.price || 'Not specified'} SAR/hour</Text>
        <Text>Province: {selectedTutor.province || 'Not specified'}</Text>

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
        
        {/* Enhanced Contact Information */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact:</Text>
          {selectedStudent.email ? (
            <TextInput
              style={styles.linkText}
              editable={false}
              value={selectedStudent.email}
              onPress={() => Linking.openURL(`mailto:${selectedStudent.email}`)}
            />
          ) : (
            <Text style={styles.detailValue}>No contact information</Text>
          )}
        </View>
  
        {/* Enhanced Subjects Display */}
        <Text style={styles.subHeader}>Enrolled Subjects:</Text>
        <View style={styles.chipContainer}>
          {selectedStudent.subjects?.length > 0 ? (
            selectedStudent.subjects.map((subj, index) => (
              <Chip key={index} style={styles.subjectChip}>
                {subj}
              </Chip>
            ))
          ) : (
            <Text style={styles.noItemsText}>No subjects enrolled</Text>
          )}
        </View>
  
        {/* Enhanced Sessions Display */}
        <Text style={styles.subHeader}>Scheduled Sessions:</Text>
        {selectedStudent.sessions?.length > 0 ? (
          selectedStudent.sessions
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
            .map((session, index) => (
              <Card key={index} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>
                    {session.subject || 'General Session'}
                  </Text>
                  <View style={styles.sessionDetailRow}>
                    <Icon source="calendar" size={16} color="#666" />
                    <Text style={styles.sessionText}>
                      {session.date ? format(new Date(session.date), 'MMM do, yyyy') : 'Date not set'}
                    </Text>
                  </View>
                  <View style={styles.sessionDetailRow}>
                    <Icon source="clock" size={16} color="#666" />
                    <Text style={styles.sessionText}>
                      {session.time || 'Time not specified'} ({session.duration} hours)
                    </Text>
                  </View>
                  {session.bookedAt && (
                    <Text style={styles.sessionNote}>
                      Booked on: {format(new Date(session.bookedAt), 'MMM do, yyyy h:mm a')}
                    </Text>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained-tonal" 
                    onPress={() => handleSessionAction(session)}
                  >
                    View Details
                  </Button>
                </Card.Actions>
              </Card>
            ))
        ) : (
          <Text style={styles.noItemsText}>No upcoming sessions</Text>
        )}
  
        {/* Enhanced Back Button */}
        <Button 
          onPress={() => setSelectedStudent(null)} 
          mode="elevated" 
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={styles.buttonLabel}
        >
          Return to Students List
        </Button>
      </View>
    );
  };

  const getSubjectsFromTutor = (tutor) => {
    if (!tutor?.grade) return "No subjects listed";
    
    try {
      let grades = tutor.grade;
      if (!Array.isArray(grades)) {
        grades = Object.entries(grades).map(([grade, subjects]) => ({
          grade,
          subjects: Array.isArray(subjects) ? subjects : []
        }));
      }
      
      const allSubjects = grades.flatMap(g => g.subjects || []);
      return allSubjects.length > 0 ? allSubjects.join(', ') : "No subjects listed";
    } catch (error) {
      console.error("Error processing subjects:", error);
      return "Error loading subjects";
    }
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                  subtitle={`${item.province || 'Location not specified'} | ${item.price || '?'} SAR/hour`} 
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
          <Text style={styles.subHeader}>Your Upcoming Sessions:</Text>
          {sessionsLoading ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>With {session.studentName || 'Student'}</Text>
                  <Text>Subject: {session.subject || 'No subject specified'}</Text>
                  <Text>When: {session.time || 'Time not specified'}</Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text>No upcoming sessions.</Text>
          )}
        </View>
  
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
    fontWeight: '600'
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
    fontWeight: 'bold'
  },
  sessionCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  loader: {
    marginVertical: 20
  }
});

export default TutorHomePage;