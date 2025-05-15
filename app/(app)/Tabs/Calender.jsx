import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { useAuth } from '../../../context/authContext';
import { doc, updateDoc, arrayRemove, arrayUnion, writeBatch, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { Button, Card } from 'react-native-paper';

const Calendar = () => {
  const { user } = useAuth();
  const [items, setItems] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const processSessionDate = (dateString) => {
    const sanitized = dateString.replace(/^[^0-9-]+/, '');
    const [year, month, day] = sanitized.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user.userID);
        const userDoc = await getDoc(userRef);
        
        const sessions = user.isStudent 
          ? userDoc.data().bookedSessions || []
          : userDoc.data().sessions || [];

        const formattedItems = {};
        sessions.forEach(session => {
          const displayDate = processSessionDate(session.date);
          
          if (!formattedItems[displayDate]) {
            formattedItems[displayDate] = [];
          }
          
          formattedItems[displayDate].push({
            ...session,
            displayDate: displayDate,
          });
        });

        setItems(formattedItems);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const handleCancelSession = async (session) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      if (user.isStudent) {
        const studentRef = doc(db, 'users', user.userID);
        const tutorRef = doc(db, 'users', session.tutorId);

        // Remove student-specific fields
        const { studentId, studentName, bookedAt, ...sessionToRestore } = session;
        batch.update(tutorRef, {
          sessions: arrayUnion({ ...sessionToRestore, status: 'available' })
        });

        batch.update(studentRef, {
          bookedSessions: arrayRemove(session)
        });
      } else {
        const tutorRef = doc(db, 'users', user.userID);
        const studentRef = doc(db, 'users', session.studentId);

        batch.update(tutorRef, {
          sessions: arrayRemove(session)
        });

        batch.update(studentRef, {
          bookedSessions: arrayRemove(session)
        });
      }

      await batch.commit();
      setModalVisible(false);
      Alert.alert('Success', 'Session cancelled successfully');
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', 'Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (session) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const tutorRef = doc(db, 'users', user.userID);
      const studentRef = doc(db, 'users', session.studentId);

      const completedSession = { ...session, status: 'completed' };

      batch.update(tutorRef, {
        sessions: arrayRemove(session),
        completedSessions: arrayUnion(completedSession)
      });

      batch.update(studentRef, {
        bookedSessions: arrayRemove(session),
        completedSessions: arrayUnion(completedSession)
      });

      await batch.commit();
      setModalVisible(false);
      Alert.alert('Success', 'Session marked as completed');
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (item) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => {
        setSelectedSession(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.itemTitle}>{item.subject}</Text>
      <Text>{item.time} - {item.duration}hrs</Text>
      <Text>With: {user.isStudent ? item.tutorName : item.studentName}</Text>
      <Text style={[styles.status, 
        { color: item.status === 'booked' ? 'orange' : 'green' }]}>
        {item.status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <Agenda
          items={items}
          renderItem={renderItem}
          renderEmptyDate={() => <View style={styles.emptyDate}><Text>No sessions</Text></View>}
          rowHasChanged={(r1, r2) => r1.id !== r2.id}
          theme={{
            agendaDayTextColor: '#222',
            agendaDayNumColor: '#222',
            agendaTodayColor: 'red',
          }}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedSession && (
            <Card style={styles.modalContent}>
              <Card.Title title="Session Details" />
              <Card.Content>
                <Text style={styles.detailTitle}>{selectedSession.subject}</Text>
                <Text>Date: {selectedSession.displayDate}</Text>
                <Text>Time: {selectedSession.time}</Text>
                <Text>Duration: {selectedSession.duration} hours</Text>
                <Text>Price: {selectedSession.price} SAR</Text>
                <Text>Status: {selectedSession.status}</Text>
                <Text>
                  With: {user.isStudent 
                    ? selectedSession.tutorName 
                    : selectedSession.studentName}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => handleCancelSession(selectedSession)}
                  loading={loading}
                  disabled={loading}
                >
                  Cancel Session
                </Button>
                {!user.isStudent && (
                  <Button 
                    mode="contained"
                    color="green"
                    onPress={() => handleCompleteSession(selectedSession)}
                    loading={loading}
                    disabled={loading}
                  >
                    Mark Completed
                  </Button>
                )}
                <Button onPress={() => setModalVisible(false)}>
                  Close
                </Button>
              </Card.Actions>
            </Card>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 50,
  },
  itemContainer: {
    backgroundColor: 'white',
    margin: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    padding: 10,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default Calendar;