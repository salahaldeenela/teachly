import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Button,
  TextInput,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/authContext';
import { db } from '../../../firebaseConfig';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { getRoomId } from '../../../assets/data/data';

const TutorCalendar = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSessionUI, setShowAddSessionUI] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newSession, setNewSession] = useState({
    subject: '',
    date: '',
    time: '',
    duration: 1,
    price: 10,
    status: 'available',
  });

  const availableSubjects = [
    'Arabic',
    'Math',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Islamic Studies',
    'English',
    'Economics',
  ];

  // Listen for bookedSessions for this tutor
  useEffect(() => {
    if (!user?.userID) return;
    setLoading(true);

    const q = query(
      collection(db, 'bookedSessions'),
      where('tutorId', '==', user.userID),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => ({
          docId: doc.id, // Use docId for the Firestore document ID
          ...doc.data(),
        }));
        setSessions(sessions);
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
  }, [user?.userID]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToDate = (timeString, referenceDate) => {
    const [timePart, period] = timeString.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const date = new Date(referenceDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const formattedTime = formatTime(selectedTime);
      setNewSession({ ...newSession, time: formattedTime });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      setNewSession({ ...newSession, date: formattedDate });
    }
  };

  const checkForOverlaps = (newSessionStart, newSessionEnd) => {
    return sessions.some((session) => {
      if (session.status === 'completed') return false;

      const [year, month, day] = session.date.split('-').map(Number);
      const sessionStart = parseTimeToDate(
        session.time,
        new Date(year, month - 1, day),
      );
      const sessionEnd = new Date(
        sessionStart.getTime() + session.duration * 60 * 60 * 1000,
      );

      return (
        (newSessionStart >= sessionStart && newSessionStart < sessionEnd) ||
        (newSessionEnd > sessionStart && newSessionEnd <= sessionEnd) ||
        (newSessionStart <= sessionStart && newSessionEnd >= sessionEnd)
      );
    });
  };

  const validateSession = () => {
    if (!newSession.subject) return 'Please select a subject';
    if (!newSession.date) return 'Please select a date';
    if (!newSession.time) return 'Please select a time';
    if (newSession.duration < 0.5 || newSession.duration > 8)
      return 'Duration must be between 0.5 and 8 hours';
    if (newSession.price < 0) return 'Price cannot be negative';
    if (newSession.price > 1000) return 'Price is too high';

    const [year, month, day] = newSession.date.split('-').map(Number);
    const sessionStart = parseTimeToDate(
      newSession.time,
      new Date(year, month - 1, day),
    );
    const sessionEnd = new Date(
      sessionStart.getTime() + newSession.duration * 60 * 60 * 1000,
    );
    const now = new Date();

    if (sessionStart <= now) {
      return 'Session time must be in the future';
    }

    if (checkForOverlaps(sessionStart, sessionEnd)) {
      return 'This session overlaps with an existing session';
    }

    return null;
  };

  const handleAddSession = async () => {
    const validationError = validateSession();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    try {
      setSaving(true);
      const sessionId = `session_${Date.now()}`;
      const sessionToAdd = {
        id: sessionId,
        ...newSession,
        createdAt: new Date().toISOString(),
      };

      const tutorRef = doc(db, 'users', user.userID);
      await updateDoc(tutorRef, {
        sessions: arrayUnion(sessionToAdd),
      });

      setSessions((prev) => [...prev, sessionToAdd]);
      setNewSession({
        subject: '',
        date: '',
        time: '',
        duration: 1,
        price: 10,
        status: 'available',
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

  // Memoized array of session details for logic
  const sessionDetailsArray = useMemo(
    () =>
      sessions.map((s) => ({
        date: s.date,
        time: s.time,
        student: s.studentName || s.student || 'Unknown student',
        studentId: s.studentId,
        tutor: user?.displayName || user?.name || 'Unknown tutor',
        tutorId: user?.userID,
        subject: s.subject,
        status: s.status,
        price: s.price,
        duration: s.duration,
        id: s.id,
      })),
    [sessions, user],
  );

  // Complete a session in bookedSessions
  const handleComplete = async (session) => {
    try {
      setSaving(true);

      // Find the session using the Firestore document ID
      const sessionToComplete = sessions.find((s) => s.docId === session.docId);
      if (!sessionToComplete) throw new Error('Session not found');

      // Mark the session as completed in Firestore using its document ID
      const sessionRef = doc(db, 'bookedSessions', session.docId);
      await updateDoc(sessionRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Room deletion logic (if last session with this student)
      const studentId = sessionToComplete.studentId;
      const tutorId = sessionToComplete.tutorId;
      const sessionsWithSameStudent = sessions.filter(
        (s) => s.studentId === studentId,
      );
      if (sessionsWithSameStudent.length === 1 && tutorId && studentId) {
        const roomId = getRoomId(studentId, tutorId);
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
        } catch (err) {
          console.error('Error deleting room:', err);
        }
      }

      // Optionally update local state if needed
      setSessions((prev) =>
        prev.map((s) =>
          s.docId === session.docId
            ? {
                ...s,
                status: 'completed',
                completedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      Alert.alert('Success', 'Session marked as completed!');
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session');
    } finally {
      setSaving(false);
    }
  };

  // Cancel a session in bookedSessions
  const handleCancel = async (session) => {
    try {
      setSaving(true);

      // Find the session using the Firestore document ID
      const sessionToRemove = sessions.find((s) => s.docId === session.docId);
      if (!sessionToRemove) throw new Error('Session not found');

      if (sessionToRemove.status === 'completed') {
        Alert.alert('Error', 'Cannot cancel a completed session');
        setSaving(false);
        return;
      }

      // Delete the session from bookedSessions collection using its Firestore doc ID
      await deleteDoc(doc(db, 'bookedSessions', session.docId));

      setSessions((prev) => prev.filter((s) => s.docId !== session.docId));
      Alert.alert('Success', 'Session cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', error.message || 'Failed to cancel session');
    } finally {
      setSaving(false);
    }
  };

  const markedDates = sessions.reduce((acc, session) => {
    if (session.date) {
      acc[session.date] = {
        marked: true,
        dotColor: session.status === 'completed' ? 'green' : 'blue',
      };
    }
    return acc;
  }, {});

  const sessionsForSelectedDate = sessions.filter(
    (s) => s.date === selectedDate,
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={styles.header}>Tutor Calendar</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Manage Sessions</Text>
          <TouchableOpacity
            onPress={() => setShowAddSessionUI(!showAddSessionUI)}
            disabled={saving}
          >
            <Text style={styles.addButton}>➕</Text>
          </TouchableOpacity>
        </View>

        {showAddSessionUI && (
          <View style={styles.sessionForm}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newSession.subject}
                onValueChange={(itemValue) =>
                  setNewSession({ ...newSession, subject: itemValue })
                }
                style={styles.picker}
                dropdownIconColor="#000"
              >
                <Picker.Item label="Select a subject" value="" />
                {availableSubjects.map((subject, index) => (
                  <Picker.Item key={index} label={subject} value={subject} />
                ))}
              </Picker>
            </View>

            <View style={styles.rowInputs}>
              <TouchableOpacity
                style={[styles.input, styles.halfInput, styles.timeInput]}
                onPress={() => setShowDatePicker(true)}
                disabled={saving}
              >
                <Text style={newSession.date ? {} : { color: '#999' }}>
                  {newSession.date || 'Select Date (YYYY-MM-DD)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.halfInput, styles.timeInput]}
                onPress={() => setShowTimePicker(true)}
                disabled={saving}
              >
                <Text style={newSession.time ? {} : { color: '#999' }}>
                  {newSession.time || 'Select Time (HH:MM AM/PM)'}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (hours):</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberInputButton}
                  onPress={() =>
                    setNewSession({
                      ...newSession,
                      duration: Math.max(0.5, newSession.duration - 0.5),
                    })
                  }
                  disabled={newSession.duration <= 0.5 || saving}
                >
                  <Text style={styles.numberInputButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={String(newSession.duration)}
                  onChangeText={(text) => {
                    const num = Number(text);
                    if (!isNaN(num)) {
                      setNewSession({
                        ...newSession,
                        duration: Math.max(0.5, Math.min(8, num)),
                      });
                    }
                  }}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <TouchableOpacity
                  style={styles.numberInputButton}
                  onPress={() =>
                    setNewSession({
                      ...newSession,
                      duration: Math.min(8, newSession.duration + 0.5),
                    })
                  }
                  disabled={newSession.duration >= 8 || saving}
                >
                  <Text style={styles.numberInputButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>
                Must be between 0.5 and 8 hours
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (JD):</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberInputButton}
                  onPress={() =>
                    setNewSession({
                      ...newSession,
                      price: Math.max(0, newSession.price - 5),
                    })
                  }
                  disabled={newSession.price <= 0 || saving}
                >
                  <Text style={styles.numberInputButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={String(newSession.price)}
                  onChangeText={(text) => {
                    const num = Number(text);
                    if (!isNaN(num)) {
                      setNewSession({
                        ...newSession,
                        price: Math.max(0, Math.min(1000, num)),
                      });
                    }
                  }}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <TouchableOpacity
                  style={styles.numberInputButton}
                  onPress={() =>
                    setNewSession({
                      ...newSession,
                      price: Math.min(1000, newSession.price + 5),
                    })
                  }
                  disabled={newSession.price >= 1000 || saving}
                >
                  <Text style={styles.numberInputButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Price per session</Text>
            </View>

            <Button
              title="Add Session"
              onPress={handleAddSession}
              disabled={saving}
              color="#3498db"
            />
          </View>
        )}

        <Calendar
          markedDates={{
            ...markedDates,
            [selectedDate]: { selected: true, selectedColor: 'orange' },
          }}
          onDayPress={(day) => setSelectedDate(day.dateString)}
        />

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {selectedDate && (
          <View style={styles.sessionList}>
            <Text style={styles.dateTitle}>Sessions on {selectedDate}</Text>
            {sessionsForSelectedDate.length === 0 && <Text>No sessions.</Text>}
            {sessionsForSelectedDate.map((session) => (
              <View key={session.docId} style={styles.sessionCard}>
                <Text>Subject: {session.subject}</Text>
                <Text>Time: {session.time}</Text>
                <Text>
                  Duration: {session.duration} hour
                  {session.duration !== 1 ? 's' : ''}
                </Text>
                <Text>Price: {session.price} JD</Text>
                <Text>Status: {session.status}</Text>

                {session.status !== 'completed' && (
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleComplete(session)}>
                      <Text style={styles.complete}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCancel(session)}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
    color: '#2c3e50',
  },
  addButton: {
    fontSize: 24,
    color: '#3498db',
    paddingHorizontal: 10,
  },
  sessionForm: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
    backgroundColor: '#FAFAFA',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#2c3e50',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  timeInput: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  numberInput: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  numberInputButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  numberInputButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionList: {
    marginTop: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sessionCard: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  complete: {
    color: 'green',
    fontWeight: 'bold',
  },
  cancel: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default TutorCalendar;
