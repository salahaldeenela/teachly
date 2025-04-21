import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,te } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../context/authContext';
import SearchAndFilter from '../../components/SearchAndFilter';


const Home = () => {

const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({
  price: 'none',
  subject: '',
  location: '',
  rating: 'none',
  gender: '',
});

  const { logout, user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  // Tutor-specific states
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user?.userType === 'student') {
      fetchTutorsByProvince(user.province);
      fetchUpcomingSessions(user.id);
    } else if (user?.userType === 'tutor') {
      fetchEnrolledStudents(user.id);
    }
  }, [user]);

  const fetchTutorsByProvince = async (province) => {
    const dummyTutors = [
      { id: '1', name: 'John Doe', province: 'Amman', sessions: ['Mon 10AM', 'Wed 2PM'] },
      { id: '2', name: 'Jane Smith', province: 'Amman', sessions: ['Tue 11AM', 'Thu 1PM'] },
      { id: '3', name: 'Alice Brown', province: 'Amman', sessions: ['Fri 9AM'] },
    ];

    const filteredTutors = dummyTutors.filter(
      (tutor) => tutor.province.toLowerCase() === province?.toLowerCase()
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
        sessions: [
          { subject: 'Biology', time: 'Thu 1PM' },
        ],
      },
    ];

    setStudents(dummyStudents);
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

  const renderStudentDetails = () => (
    <View style={styles.section}>
      <Text style={styles.title}>{selectedStudent.name}'s Details</Text>
      <Text>Subjects enrolled with you:</Text>
      {selectedStudent.subjects.map((subj, index) => (
        <Text key={index}>- {subj}</Text>
      ))}

      <Text style={{ marginTop: 10 }}>Sessions:</Text>
      {selectedStudent.sessions.map((session, index) => (
        <Text key={index}>
          - {session.subject}: {session.time}
        </Text>
      ))}

      <Button onPress={() => setSelectedStudent(null)} mode="outlined" style={styles.backButton}>
        Back to Students
      </Button>
    </View>
  );

  if (!user) return null;

  if (user.userType === 'student') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Welcome Student</Text>

        <Button onPress={logout} mode="contained" style={styles.logoutButton}>
          Logout
        </Button>
{/* Search and Filter */}
        <SearchAndFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
        />

        {selectedTutor ? (
          renderTutorProfile()
        ) : (
          <>
            <Text style={styles.subHeader}>Tutors near you ({user.province}):</Text>
            {tutors.length > 0 ? (
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
            ) : (
              <Text>No tutors found in your area.</Text>
            )}

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
  }

  if (user.userType === 'tutor') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Welcome Tutor</Text>
        <Button onPress={logout} mode="contained" style={styles.logoutButton}>
          Logout
        </Button>

        {/* Search and Filter */}
        <SearchAndFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
        />

        {selectedStudent ? (
          renderStudentDetails()
        ) : (
          <>
            <Text style={styles.subHeader}>Your Students:</Text>
            {students.length > 0 ? (
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
            ) : (
              <Text>You have no enrolled students yet.</Text>
            )}
          </>
        )}
      </View>
    );
  }

  return null;
};

export default Home;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
    padding: 10,
  },
  section: {
    marginTop: 20,
  },
  logoutButton: {
    marginBottom: 20,
  },
  backButton: {
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
});
