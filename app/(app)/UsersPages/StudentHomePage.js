import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../context/authContext';
import SearchAndFilter from '../../components/SearchAndFilter';
import { FakeTutors } from '../../assets/Fakedata';

const StudentHomePage = () => {
  const { logout, user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  useEffect(() => {
    fetchTutorsByProvince(user.province);
    fetchUpcomingSessions(user.id);
  }, [user]);

  const fetchTutorsByProvince = async (province) => {
    const dummyTutors = [
      { id: '1', name: 'John Doe', province: 'Amman', sessions: ['Mon 10AM', 'Wed 2PM'] },
      { id: '2', name: 'Jane Smith', province: 'Amman', sessions: ['Tue 11AM', 'Thu 1PM'] },
      { id: '3', name: 'Alice Brown', province: 'Amman', sessions: ['Fri 9AM'] },
    ];
    const filteredTutors = dummyTutors.filter(tutor =>
      tutor.province.toLowerCase() === province?.toLowerCase()
    );
    setTutors(filteredTutors);
  };

  const fetchUpcomingSessions = async (studentId) => {
    const dummySessions = [
      { id: 's1', time: '2025-04-22 10:00 AM', tutor: 'John Doe' },
      { id: 's2', time: '2025-04-24 2:00 PM', tutor: 'Jane Smith' },
    ];
    setUpcomingSessions(dummySessions);
  };

  const renderTutorProfile = () => (
    <View style={styles.section}>
      <Text style={styles.title}>{selectedTutor.name}'s Profile</Text>
      <Text>Available Sessions:</Text>
      {selectedTutor.sessions.map((session, idx) => (
        <Text key={idx}>- {session}</Text>
      ))}
      <Button onPress={() => setSelectedTutor(null)} mode="outlined" style={styles.backButton}>
        Back to Tutors
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Student</Text>
      <Button onPress={logout} mode="contained" style={styles.logoutButton}>
        Logout
      </Button>
      <SearchAndFilter tutorsData={FakeTutors} onResultsFiltered={setTutors} />
      {selectedTutor ? (
        renderTutorProfile()
      ) : (
        <>
          <Text style={styles.subHeader}>Tutors near you ({user.province}):</Text>
          <FlatList
            data={tutors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedTutor(item)}>
                <Card style={styles.card}>
                  <Card.Title title={item.name} subtitle={`Province: ${item.province}`} />
                </Card>
              </TouchableOpacity>
            )}
          />
          <View style={styles.section}>
            <Text style={styles.subHeader}>Closest Upcoming Sessions:</Text>
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <Text key={session.id}>
                  {session.time} with {session.tutor}
                </Text>
              ))
            ) : (
              <Text>No upcoming sessions.</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default StudentHomePage;

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subHeader: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  card: { marginBottom: 10, padding: 10 },
  section: { marginTop: 20 },
  logoutButton: { marginBottom: 20 },
  backButton: { marginTop: 10 },
  title: { fontSize: 20, marginBottom: 10 },
});
