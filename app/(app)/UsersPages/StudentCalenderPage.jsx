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
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteDoc,
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

  const handleCancelSession = async (sessionId) => {
    try {
      setSaving(true);
      const studentRef = doc(db, 'users', user.uid);

      const sessionToRemove = upcomingSessions.find((s) => s.id === sessionId);
      if (!sessionToRemove) throw new Error('Session not found');

      // Find the tutor name and id for the session to remove
      const tutorName =
        sessionToRemove.tutorName || sessionToRemove.tutor || 'Unknown tutor';
      const tutorId = sessionToRemove.tutorId;
      const studentId = user.uid;

      // Count how many sessions exist with this tutor
      const sessionsWithSameTutor = sessionDetailsArray.filter(
        (s) => s.tutor === tutorName,
      );

      if (sessionsWithSameTutor.length > 1) {
        console.log('nothing to do');
      } else if (sessionsWithSameTutor.length === 1) {
        console.log('something to do');
        // Only one session left with this tutor, so delete the room
        if (tutorId && studentId) {
          const roomId = getRoomId(studentId, tutorId);
          try {
            // Delete the room document from Firestore
            await deleteDoc(doc(db, 'rooms', roomId));
            console.log('Room deleted:', roomId);
          } catch (err) {
            console.error('Error deleting room:', err);
          }
        } else {
          console.log('Missing tutorId or studentId, cannot delete room');
        }
      }

      if (sessionToRemove.status === 'completed') {
        Alert.alert('Error', 'Cannot cancel a completed session');
        return;
      }

      await updateDoc(studentRef, {
        bookedSessions: arrayRemove(sessionToRemove),
      });

      setUpcomingSessions((prev) => prev.filter((s) => s.id !== sessionId));
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
                    onPress={() => handleCancelSession(session.id)}
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
