import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../../context/authContext';
import { db } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

const AdminHomePage = () => {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [reportedTutors, setReportedTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsersAndReports = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(allUsers.filter(u => u.userType === 'student'));
        setTutors(allUsers.filter(u => u.userType === 'tutor'));

        // Fetch all reports
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        const reports = reportsSnapshot.docs.map(doc => doc.data());

        // Group report messages by tutor ID
        const reportsByTutor = {};
        reports.forEach(report => {
          if (!reportsByTutor[report.reportedTutor]) {
            reportsByTutor[report.reportedTutor] = [];
          }
          if (report.message) {
            reportsByTutor[report.reportedTutor].push(report.message);
          }
        });

        // Create a list of reported tutors with all their messages
        const reportedTutorsList = Object.keys(reportsByTutor)
          .map(tutorId => {
            const tutor = allUsers.find(
              u => u.userType === 'tutor' && u.id === tutorId
            );
            if (tutor) {
              return {
                ...tutor,
                reportMessages: reportsByTutor[tutorId],
              };
            }
            return null;
          })
          .filter(Boolean);

        setReportedTutors(reportedTutorsList);
      } catch (error) {
        setStudents([]);
        setTutors([]);
        setReportedTutors([]);
      }
      setLoading(false);
    };

    fetchUsersAndReports();
  }, []);

  if (!user) return null;
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.hello}>Hello Admin</Text>
      </View>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Students</Text>
        {students.length === 0 ? (
          <Text>No students found.</Text>
        ) : (
          students.map(item => (
            <View style={styles.userCard} key={item.id}>
              <Text style={styles.userName}>{item.name} ({item.email})</Text>
            </View>
          ))
        )}

        <Text style={styles.header}>Tutors</Text>
        {tutors.length === 0 ? (
          <Text>No tutors found.</Text>
        ) : (
          tutors.map(item => (
            <View style={styles.userCard} key={item.id}>
              <Text style={styles.userName}>{item.name} ({item.email})</Text>
            </View>
          ))
        )}

        <Text style={styles.header}>Reported Tutors</Text>
        {reportedTutors.length === 0 ? (
          <Text>No reported tutors found.</Text>
        ) : (
          reportedTutors.map(item => (
            <View style={styles.userCard} key={item.id}>
              <Text style={styles.userName}>
                {item.name} ({item.email})
              </Text>
              <View style={{marginTop: 4}}>
                {item.reportMessages.map((msg, idx) => (
                  <Text key={idx} style={{color: 'red', fontSize: 14}}>
                    Report: {msg}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <FontAwesome5 name="sign-out-alt" size={22} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { padding: 16, alignItems: 'center' },
  hello: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
  userCard: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  userName: { fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    justifyContent: 'center',
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});

export default AdminHomePage;