import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../context/authContext';
import SearchAndFilter from '../../components/SearchAndFilter';
import { FakeTutors } from '../../assets/Fakedata';

const TutorHomePage = () => {
  const { logout, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchEnrolledStudents(user.id);
  }, [user]);

  const fetchEnrolledStudents = async (tutorId) => {
    const dummyStudents = [
      {
        id: 'stu1',
        name: 'Ahmad Ali',
        subjects: ['Math', 'Physics'],
        sessions: [
          { subject: 'Math', time: 'Mon 10AM' },
          { subject: 'Physics', time: 'Wed 2PM' },
        ],
      },
      {
        id: 'stu2',
        name: 'Sara Nasser',
        subjects: ['Biology'],
        sessions: [{ subject: 'Biology', time: 'Thu 1PM' }],
      },
    ];
    setStudents(dummyStudents);
  };

  const renderStudentDetails = () => (
    <View style={styles.section}>
      <Text style={styles.title}>{selectedStudent.name}'s Details</Text>
      <Text>Subjects enrolled with you:</Text>
      {selectedStudent.subjects.map((subj, index) => (
        <Text key={index}>- {subj}</Text>
      ))}
      <Text style={{ marginTop: 10 }}>Sessions:</Text>
      {selectedStudent.sessions.map((session, index) => (
        <Text key={index}>- {session.subject}: {session.time}</Text>
      ))}
      <Button onPress={() => setSelectedStudent(null)} mode="outlined" style={styles.backButton}>
        Back to Students
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Tutor</Text>
      <Button onPress={logout} mode="contained" style={styles.logoutButton}>
        Logout
      </Button>
      <SearchAndFilter tutorsData={FakeTutors} onResultsFiltered={() => {}} />
      {selectedStudent ? (
        renderStudentDetails()
      ) : (
        <>
          <Text style={styles.subHeader}>Your Students:</Text>
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedStudent(item)}>
                <Card style={styles.card}>
                  <Card.Title title={item.name} subtitle={`Subjects: ${item.subjects.join(', ')}`} />
                </Card>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
};

export default TutorHomePage;

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
