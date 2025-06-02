import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { auth, db } from '../../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  arrayRemove,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getRoomId } from '../../../assets/data/data';

const StudentCalendar = () => {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );

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
    if (!user?.uid) return;

    setLoading(true);
    const q = query(
      collection(db, 'bookedSessions'),
      where('studentId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => ({
          docId: doc.id, // Firestore document ID
          ...doc.data(),
        }));
        setUpcomingSessions(sessions);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching booked sessions:', error);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    // fetchUpcomingSessions(); // No need to call this, onSnapshot will update the state
  };

  // Use useMemo to derive the session details array from upcomingSessions
  const sessionDetailsArray = useMemo(
    () =>
      upcomingSessions.map((s) => ({
        date: s.date,
        time: s.time,
        student: s.studentName || s.student || 'Unknown student',
        tutor: s.tutorName || s.tutor || 'Unknown tutor',
        tutorId: s.tutorId, // Make sure this exists in your session object
        studentId: s.studentId, // Make sure this exists in your session object
        subject: s.subject,
        status: s.status,
        price: s.price,
        duration: s.duration,
        id: s.id,
      })),
    [upcomingSessions],
  );
  console.log('Session Details Array:', sessionDetailsArray);

  const handleCancelSession = async (docId) => {
    try {
      setSaving(true);

      // Find the session using the Firestore document ID
      const sessionToRemove = upcomingSessions.find((s) => s.docId === docId);
      if (!sessionToRemove) throw new Error('Session not found');

      // Room deletion logic (if last session with this tutor)
      const tutorId = sessionToRemove.tutorId;
      const studentId = sessionToRemove.studentId;
      const sessionsWithSameTutor = sessionDetailsArray.filter(
        (s) => s.tutorId === tutorId,
      );

      if (sessionsWithSameTutor.length === 1 && tutorId && studentId) {
        const roomId = getRoomId(studentId, tutorId);
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
          console.log('Room deleted:', roomId);
        } catch (err) {
          console.error('Error deleting room:', err);
        }
      }

      if (sessionToRemove.status === 'completed') {
        Alert.alert('Error', 'Cannot cancel a completed session');
        setSaving(false);
        return;
      }

      // Delete the session from bookedSessions collection using its Firestore doc ID
      await deleteDoc(doc(db, 'bookedSessions', docId));

      setUpcomingSessions((prev) => prev.filter((s) => s.docId !== docId));
      Alert.alert('Success', 'Session cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', error.message || 'Failed to cancel session');
    } finally {
      setSaving(false);
    }
  };

  const getMarkedDates = (sessions) => {
    const marked = {};
    sessions.forEach(({ date }) => {
      marked[date] = {
        marked: true,
        dotColor: '#00adf5',
      };
    });
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#00adf5',
    };
    return marked;
  };

  const filteredSessions = upcomingSessions.filter(
    (session) => session.date === selectedDate,
  );

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

        {/* Calendar View */}
        <Calendar
          markedDates={getMarkedDates(upcomingSessions)}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          style={styles.calendar}
          theme={{
            selectedDayBackgroundColor: '#00adf5',
            todayTextColor: '#00adf5',
            arrowColor: '#00adf5',
            dotColor: '#00adf5',
          }}
        />

        {/* Session Cards for Selected Date */}
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              style={[
                styles.sessionCard,
                session.status === 'completed' && styles.completedSessionCard,
              ]}
            >
              <Card.Content>
                <Text style={styles.sessionTitle}>
                  With {session.tutorName || session.tutor || 'Unknown tutor'}
                </Text>
                <Text>
                  Student:{' '}
                  {session.studentName || session.student || 'Unknown student'}
                </Text>
                <Text>
                  Subject: {session.subject || 'No subject specified'}
                </Text>

                <Text>
                  When: {session.date} at {session.time}
                </Text>
                <Text>Duration: {session.duration} hour(s)</Text>
                <Text>Price: {session.price} JD</Text>
                <Text>Status: {session.status || 'unknown'}</Text>

                {session.status !== 'completed' ? (
                  <Button
                    title="Cancel Session"
                    onPress={() => handleCancelSession(session.docId)}
                    color="#FF3B30"
                    disabled={saving}
                  />
                ) : (
                  <Text style={styles.completedText}>
                    This session is completed
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noSessionsText}>No sessions on this day.</Text>
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
    textAlign: 'center',
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
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
