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
import { fetchTutorSessions } from './SharedHomeUtils';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
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

  const loadSessions = async () => {
    try {
      setLoading(true);
      if (user) {
        const sessions = await fetchTutorSessions(user.userID);
        setSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
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
    [sessions, user]
  );

  const handleComplete = async (session) => {
    // Find the studentId for this session
    const studentId = session.studentId;
    const tutorId = user.userID;

    // Count how many sessions exist with this student
    const sessionsWithSameStudent = sessionDetailsArray.filter(
      (s) => s.studentId === studentId
    );

    if (sessionsWithSameStudent.length > 1) {
      console.log('nothing to do');
    } else if (sessionsWithSameStudent.length === 1) {
      console.log('something to do');
      // Only one session left with this student, so delete the room
      if (studentId && tutorId) {
        const roomId = getRoomId(studentId, tutorId);
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
          console.log('Room deleted:', roomId);
        } catch (err) {
          console.error('Error deleting room:', err);
        }
      } else {
        console.log('Missing tutorId or studentId, cannot delete room');
      }
    }

    const tutorRef = doc(db, 'users', user.userID);
    const updated = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    await updateDoc(tutorRef, {
      sessions: arrayRemove(session),
    });
    await updateDoc(tutorRef, {
      sessions: arrayUnion(updated),
    });

    setSessions((prev) => prev.map((s) => (s.id === session.id ? updated : s)));
  };

  const handleCancel = async (session) => {
    // Find the studentId for this session
    const studentId = session.studentId;
    const tutorId = user.userID;

    // Count how many sessions exist with this student
    const sessionsWithSameStudent = sessionDetailsArray.filter(
      (s) => s.studentId === studentId
    );

    if (sessionsWithSameStudent.length > 1) {
      console.log('nothing to do');
    } else if (sessionsWithSameStudent.length === 1) {
      console.log('something to do');
      // Only one session left with this student, so delete the room
      if (studentId && tutorId) {
        const roomId = getRoomId(studentId, tutorId);
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
          console.log('Room deleted:', roomId);
        } catch (err) {
          console.error('Error deleting room:', err);
        }
      } else {
        console.log('Missing tutorId or studentId, cannot delete room');
      }
    }

    const tutorRef = doc(db, 'users', user.userID);
    await updateDoc(tutorRef, {
      sessions: arrayRemove(session),
    });
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
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
              <View key={session.id} style={styles.sessionCard}>
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
