import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import SearchAndFilter from '../../../components/SearchAndFilter';
import { fetchTutors, fetchUpcomingSessions } from './SharedHomeUtils';
import { doc, updateDoc, arrayUnion, arrayRemove, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const StudentHomePage = () => {
  const { logout, user } = useAuth();
  const [allTutors, setAllTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tutorsLoading, setTutorsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setTutorsLoading(true);
        
        // Load tutors
        const tutorsData = await fetchTutors();
        setAllTutors(tutorsData);
        setFilteredTutors(tutorsData);
        
        // Load upcoming sessions
        const sessions = await fetchUpcomingSessions(user.id);
        setUpcomingSessions(sessions);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setTutorsLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  const handleBookSession = async (tutorId, sessionId) => {
    try {
      setLoading(true);
      
      // Create references
      const tutorRef = doc(db, 'users', tutorId);
      const studentRef = doc(db, 'users', user.id);
      
      // Get current data
      const tutorDoc = await getDoc(tutorRef);
      if (!tutorDoc.exists()) throw new Error('Tutor not found');
      
      const tutorData = tutorDoc.data();
      const sessionToBook = tutorData.sessions?.find(s => s.id === sessionId);
      if (!sessionToBook) throw new Error('Session not found');
      
      // Prepare updates
      const batch = writeBatch(db);
      
      // Remove from tutor's available sessions
      batch.update(tutorRef, {
        sessions: arrayRemove(sessionToBook)
      });
      
      // Add to student's booked sessions
      const bookedSession = {
        ...sessionToBook,
        tutorId,
        tutorName: tutorData.name,
        studentId: user.id,
        studentName: user.name,
        status: 'booked',
        bookedAt: new Date().toISOString()
      };
      
      batch.update(studentRef, {
        bookedSessions: arrayUnion(bookedSession)
      });
      
      // Execute batch
      await batch.commit();
      
      // Update local state
      setSelectedTutor(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId)
      }));
      
      setUpcomingSessions(prev => [...prev, bookedSession]);
      
      Alert.alert('Success', 'Session booked successfully!');
    } catch (error) {
      console.error('Error booking session:', error);
      Alert.alert('Error', error.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

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
          selectedTutor.sessions
            .filter(session => session.status === 'available')
            .map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>{session.subject}</Text>
                  <Text>Date: {session.date}</Text>
                  <Text>Time: {session.time}</Text>
                  <Text>Duration: {session.duration} hour(s)</Text>
                  <Text>Price: {session.price} SAR</Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => handleBookSession(selectedTutor.id, session.id)}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Booking...' : 'Book Session'}
                  </Button>
                </Card.Actions>
              </Card>
            ))
        ) : (
          <Text>No available sessions</Text>
        )}
  
        <Button 
          onPress={() => setSelectedTutor(null)} 
          mode="outlined" 
          style={styles.backButton}
          disabled={loading}
        >
          Back to Tutors
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
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome {user?.name || 'Student'}</Text>
        <Button onPress={logout} mode="contained" style={styles.logoutButton}>
          Logout
        </Button>
  
        <SearchAndFilter tutorsData={allTutors} onResultsFiltered={setFilteredTutors} />
  
        <Text style={styles.subHeader}>Tutors near you ({user?.province || 'your area'}):</Text>
        
        {tutorsLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : filteredTutors.length > 0 ? (
          filteredTutors.map((tutor) => (
            <TouchableOpacity 
              key={tutor.id} 
              onPress={() => setSelectedTutor(tutor)}
              disabled={tutorsLoading}
            >
              <Card style={styles.card}>
                <Card.Title 
                  title={tutor.name || 'No name'} 
                  subtitle={`${tutor.province || 'Location not specified'} | ${tutor.price || '?'} SAR/hour`} 
                />
                <Card.Content>
                  <Text>Teaches: {getSubjectsFromTutor(tutor)}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No tutors found in your area.</Text>
        )}
  
        <View style={styles.section}>
          <Text style={styles.subHeader}>Your Upcoming Sessions:</Text>
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>With {session.tutorName || 'Unknown tutor'}</Text>
                  <Text>Subject: {session.subject || 'No subject specified'}</Text>
                  <Text>When: {session.date} at {session.time}</Text>
                  <Text>Status: {session.status || 'unknown'}</Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text>No upcoming sessions.</Text>
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
    flex: 1 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  subHeader: { 
    fontSize: 18, 
    marginTop: 20, 
    marginBottom: 10,
    fontWeight: '600'
  },
  card: { 
    marginBottom: 10, 
    padding: 10 
  },
  section: { 
    marginTop: 20 
  },
  logoutButton: { 
    marginBottom: 20 
  },
  backButton: { 
    marginTop: 20 
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

export default StudentHomePage;