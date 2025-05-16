import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import { fetchTutorSessions } from './SharedHomeUtils';

const TutorCalender = () => {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        if (user) {
          const sessions = await fetchTutorSessions(user.userID);
          setUpcomingSessions(sessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Upcoming Sessions</Text>
        
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
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
    marginBottom: 20,
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

export default TutorCalender;