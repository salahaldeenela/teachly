import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Button, 
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Card } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/authContext';
import { fetchTutorSessions } from './SharedHomeUtils';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const TutorCalendar = () => {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSessionUI, setShowAddSessionUI] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newSession, setNewSession] = useState({
    subject: '',
    date: '',
    time: '',
    duration: 1,
    price: 10,
    status: 'available'
  });

  const availableSubjects = [
    'Arabic', 'Math', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Islamic Studies', 'English', 'Economics',
  ];

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
      setNewSession({...newSession, time: formattedTime});
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      setNewSession({...newSession, date: formattedDate});
    }
  };

  const checkForOverlaps = (newSessionStart, newSessionEnd) => {
    return upcomingSessions.some(session => {
      if (session.status === 'completed') return false;
      
      const [year, month, day] = session.date.split('-').map(Number);
      const sessionStart = parseTimeToDate(session.time, new Date(year, month - 1, day));
      const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 60 * 1000);
      
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
    if (newSession.duration < 0.5 || newSession.duration > 8) return 'Duration must be between 0.5 and 8 hours';
    if (newSession.price < 0) return 'Price cannot be negative';
    if (newSession.price > 1000) return 'Price is too high';

    const [year, month, day] = newSession.date.split('-').map(Number);
    const sessionStart = parseTimeToDate(newSession.time, new Date(year, month - 1, day));
    const sessionEnd = new Date(sessionStart.getTime() + newSession.duration * 60 * 60 * 1000);
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
        createdAt: new Date().toISOString()
      };

      const tutorRef = doc(db, 'users', user.userID);
      await updateDoc(tutorRef, {
        sessions: arrayUnion(sessionToAdd)
      });

      setUpcomingSessions(prev => [...prev, sessionToAdd]);
      setNewSession({
        subject: '',
        date: '',
        time: '',
        duration: 1,
        price: 10,
        status: 'available'
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


  const handleDeleteSession = async (sessionId) => {
    try {
      setSaving(true);
      const tutorRef = doc(db, 'users', user.userID);
      const sessionToRemove = upcomingSessions.find(s => s.id === sessionId);
      if (!sessionToRemove) throw new Error('Session not found');

      await updateDoc(tutorRef, {
        sessions: arrayRemove(sessionToRemove)
      });

      setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));
      Alert.alert('Success', 'Session deleted successfully!');
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert('Error', error.message || 'Failed to delete session');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setSaving(true);
      const tutorRef = doc(db, 'users', user.userID);
      const sessionIndex = upcomingSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) throw new Error('Session not found');

      const updatedSession = {
        ...upcomingSessions[sessionIndex],
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      await updateDoc(tutorRef, {
        sessions: arrayRemove(upcomingSessions[sessionIndex])
      });
      await updateDoc(tutorRef, {
        sessions: arrayUnion(updatedSession)
      });

      const updatedSessions = [...upcomingSessions];
      updatedSessions[sessionIndex] = updatedSession;
      setUpcomingSessions(updatedSessions);

      Alert.alert('Success', 'Session marked as completed!');
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', error.message || 'Failed to complete session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Schedule</Text>

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
                  setNewSession({...newSession, subject: itemValue})
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
                <Text style={newSession.date ? {} : {color: '#999'}}>
                  {newSession.date || 'Select Date (YYYY-MM-DD)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.input, styles.halfInput, styles.timeInput]}
                onPress={() => setShowTimePicker(true)}
                disabled={saving}
              >
                <Text style={newSession.time ? {} : {color: '#999'}}>
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
                  onPress={() => setNewSession({
                    ...newSession,
                    duration: Math.max(0.5, newSession.duration - 0.5)
                  })}
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
                        duration: Math.max(0.5, Math.min(8, num))
                      });
                    }
                  }}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <TouchableOpacity 
                  style={styles.numberInputButton}
                  onPress={() => setNewSession({
                    ...newSession,
                    duration: Math.min(8, newSession.duration + 0.5)
                  })}
                  disabled={newSession.duration >= 8 || saving}
                >
                  <Text style={styles.numberInputButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Must be between 0.5 and 8 hours</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (JD):</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity 
                  style={styles.numberInputButton}
                  onPress={() => setNewSession({
                    ...newSession,
                    price: Math.max(0, newSession.price - 5)
                  })}
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
                        price: Math.max(0, Math.min(1000, num))
                      });
                    }
                  }}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <TouchableOpacity 
                  style={styles.numberInputButton}
                  onPress={() => setNewSession({
                    ...newSession,
                    price: Math.min(1000, newSession.price + 5)
                  })}
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

        <Text style={styles.subHeader}>Upcoming Sessions</Text>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : upcomingSessions.filter(s => s.status !== 'completed').length > 0 ? (
          upcomingSessions
            .filter(s => s.status !== 'completed')
            .sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateA - dateB;
            })
            .map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>{session.subject}</Text>
                  <Text>Date: {session.date}</Text>
                  <Text>Time: {session.time}</Text>
                  <Text>Duration: {session.duration} hour{session.duration !== 1 ? 's' : ''}</Text>
                  <Text>Price: {session.price} JD</Text>
                  <Text>Status: {session.status}</Text>

                  <View style={styles.buttonContainer}>
                    <Button 
                      title="Cancel" 
                      onPress={() => handleDeleteSession(session.id)} 
                      color="#FF3B30"
                      disabled={saving}
                    />
                    <Button 
                      title="Complete" 
                      onPress={() => handleCompleteSession(session.id)} 
                      color="#4CAF50"
                      disabled={saving}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))
        ) : (
          <Text style={styles.noSessionsText}>No upcoming sessions</Text>
        )}

        <Text style={styles.subHeader}>Completed Sessions</Text>

        {upcomingSessions.filter(s => s.status === 'completed').length > 0 ? (
          upcomingSessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .map((session) => (
              <Card key={session.id} style={styles.completedSessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>{session.subject}</Text>
                  <Text>Date: {session.date}</Text>
                  <Text>Time: {session.time}</Text>
                  <Text>Completed on: {new Date(session.completedAt).toLocaleString()}</Text>
                </Card.Content>
              </Card>
            ))
        ) : (
          <Text style={styles.noSessionsText}>No completed sessions</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { 
    paddingBottom: 40,
    paddingTop: 20
  },
  container: { 
    padding: 20, 
    flex: 1 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#2c3e50'
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 15,
    color: '#34495e'
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
    color: '#2c3e50'
  },
  addButton: { 
    fontSize: 24, 
    color: '#3498db',
    paddingHorizontal: 10
  },
  sessionForm: { 
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    elevation: 2
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
    height: 50 
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
    marginRight: 8 
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
  sessionCard: { 
    marginBottom: 15,
    backgroundColor: '#ffffff',
    elevation: 3
  },
  completedSessionCard: { 
    backgroundColor: '#e8f5e9',
    marginBottom: 15,
    elevation: 2
  },
  sessionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 5,
    color: '#2980b9'
  },
  buttonContainer: { 
    marginTop: 10, 
    gap: 10 
  },
  loader: { 
    marginTop: 20,
    marginBottom: 20
  },
  noSessionsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 10,
    fontStyle: 'italic'
  }
});

export default TutorCalendar;