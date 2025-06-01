import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Button,
  Alert,
  RefreshControl
} from 'react-native';
import { Card } from 'react-native-paper';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentCalendar = () => {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchUpcomingSessions = useCallback(async () => {
    if (!user?.uid) return;
    try {
      if (!refreshing) setLoading(true);
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
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    if (user) fetchUpcomingSessions();
  }, [user, fetchUpcomingSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUpcomingSessions();
  };

  const handleCancelSession = async (sessionId) => {
    try {
      setSaving(true);
      const studentRef = doc(db, 'users', user.uid);

      const sessionToRemove = upcomingSessions.find(s => s.id === sessionId);
      if (!sessionToRemove) throw new Error('Session not found');

      if (sessionToRemove.status === 'completed') {
        Alert.alert('Error', 'Cannot cancel a completed session');
        return;
      }

      await updateDoc(studentRef, {
        bookedSessions: arrayRemove(sessionToRemove)
      });

      setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));
      Alert.alert('Success', 'Session cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', error.message || 'Failed to cancel session');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={styles.header}>Your Sessions</Text>
        
        {upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <Card key={session.id} style={[
              styles.sessionCard,
              session.status === 'completed' && styles.completedSessionCard
            ]}>
              <Card.Content>
                <Text style={styles.sessionTitle}>With {session.tutorName || 'Unknown tutor'}</Text>
                <Text>Subject: {session.subject || 'No subject specified'}</Text>
                <Text>When: {session.date} at {session.time}</Text>
                <Text>Duration: {session.duration} hour(s)</Text>
                <Text>Price: {session.price} JD</Text>
                <Text>Status: {session.status || 'unknown'}</Text>
                
                {session.status !== 'completed' && (
                  <Button 
                    title="Cancel Session" 
                    onPress={() => handleCancelSession(session.id)} 
                    color="#FF3B30"
                    disabled={saving}
                  />
                )}
                {session.status === 'completed' && (
                  <Text style={styles.completedText}>This session is completed</Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noSessionsText}>No sessions found.</Text>
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
  completedSessionCard: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
  completedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default StudentCalendar;
