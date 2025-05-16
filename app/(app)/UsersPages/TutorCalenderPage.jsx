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
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Card } from 'react-native-paper';
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
  
  const [newSession, setNewSession] = useState({
    subject: '',
    date: '',
    time: '',
    duration: 1,
    price: 0,
    status: 'available'
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

  const handleAddSession = async () => {
    if (!newSession.subject || !newSession.date || !newSession.time) {
      Alert.alert('Error', 'Please fill all required session details');
      return;
    }

    try {
      setSaving(true);
      const sessionId = `session_${Date.now()}`;
      const sessionToAdd = {
        id: sessionId,
        subject: newSession.subject,
        date: newSession.date,
        time: newSession.time,
        duration: newSession.duration || 1,
        price: newSession.price || 0,
        status: 'available',
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
        price: 0,
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
      if (!sessionToRemove) {
        throw new Error('Session not found');
      }

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
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

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
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={newSession.date}
                onChangeText={(text) => setNewSession({...newSession, date: text})}
                placeholder="Date (YYYY-MM-DD)"
                editable={!saving}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={newSession.time}
                onChangeText={(text) => setNewSession({...newSession, time: text})}
                placeholder="Time (HH:MM AM/PM)"
                editable={!saving}
              />
            </View>

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={String(newSession.duration)}
                onChangeText={(text) => setNewSession({
                  ...newSession, 
                  duration: Math.max(1, Number(text) || 1)
                })}
                placeholder="Duration (hours)"
                keyboardType="numeric"
                editable={!saving}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={String(newSession.price)}
                onChangeText={(text) => setNewSession({
                  ...newSession, 
                  price: Math.max(0, Number(text) || 0)
                })}
                placeholder="Price (JD)"
                keyboardType="numeric"
                editable={!saving}
              />
            </View>

            <Button 
              title="Add Session" 
              onPress={handleAddSession} 
              disabled={
                !newSession.subject || 
                !newSession.date || 
                !newSession.time || 
                saving
              }
            />
          </View>
        )}

        <Text style={styles.header}>Your Upcoming Sessions</Text>
        
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <Card key={session.id} style={[
              styles.sessionCard,
              session.status === 'completed' && styles.completedSessionCard
            ]}>
              <Card.Content>
                <Text style={styles.sessionTitle}>{session.subject || 'No subject specified'}</Text>
                <Text>Date: {session.date || 'Date not specified'}</Text>
                <Text>Time: {session.time || 'Time not specified'}</Text>
                <Text>Duration: {session.duration || 1} hour{session.duration !== 1 ? 's' : ''}</Text>
                <Text>Price: {session.price || 0} JD</Text>
                <Text>Status: {session.status || 'available'}</Text>
                
                <View style={styles.buttonContainer}>
                  {session.status !== 'completed' && (
                    <>
                      <Button 
                        title="Cancel Session" 
                        onPress={() => handleDeleteSession(session.id)} 
                        color="#FF3B30"
                        disabled={saving}
                      />
                      <Button 
                        title="Mark Completed" 
                        onPress={() => handleCompleteSession(session.id)} 
                        color="#4CAF50"
                        disabled={saving}
                      />
                    </>
                  )}
                  {session.status === 'completed' && (
                    <Text style={styles.completedText}>This session is completed</Text>
                  )}
                </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    fontSize: 24,
    color: '#007AFF',
  },
  sessionForm: {
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
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
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  sessionCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  completedSessionCard: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  loader: {
    marginVertical: 20
  }
});

export default TutorCalendar;