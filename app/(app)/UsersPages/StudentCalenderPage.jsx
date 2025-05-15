import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentCalendar = () => {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const studentRef = doc(db, 'users', user.uid);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const sessions = studentData.bookedSessions || [];
          setUpcomingSessions(sessions);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSessions();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Upcoming Sessions</Text>
        
        {upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <Card.Content>
                <Text style={styles.sessionTitle}>With {session.tutorName || 'Unknown tutor'}</Text>
                <Text>Subject: {session.subject || 'No subject specified'}</Text>
                <Text>When: {session.date} at {session.time}</Text>
                <Text>Duration: {session.duration} hour(s)</Text>
                <Text>Price: {session.price} SAR</Text>
                <Text>Status: {session.status || 'unknown'}</Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noSessionsText}>No upcoming sessions.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  container: {
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
  noSessionsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default StudentCalendar;