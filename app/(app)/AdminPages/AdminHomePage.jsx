import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../context/authContext';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

const AdminHomePage = () => {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [reportedTutors, setReportedTutors] = useState([]);
  const [bannedTutors, setBannedTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleUnbanTutor = async (bannedTutor) => {
    try {
      await deleteDoc(doc(db, 'banned', bannedTutor.id));
      Alert.alert('Tutor Unbanned', `${bannedTutor.name} has been unbanned.`);
      fetchData(); // Refresh everything
    } catch (error) {
      Alert.alert('Error', 'Failed to unban tutor.');
    }
  };

  const handleBanTutor = async (tutor) => {
    try {
      await addDoc(collection(db, 'banned'), {
        tutorId: tutor.id,
        name: tutor.name,
        email: tutor.email,
        bannedAt: new Date(),
      });
      Alert.alert('Tutor Banned', `${tutor.name} has been banned and added to the banned list.`);
      fetchData(); // Refresh everything
    } catch (error) {
      Alert.alert('Error', 'Failed to ban tutor.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(allUsers.filter(u => u.userType === 'student'));
      setTutors(allUsers.filter(u => u.userType === 'tutor'));

      const reportsSnapshot = await getDocs(collection(db, 'reports'));
      const reports = reportsSnapshot.docs.map(doc => doc.data());

      const reportsByTutor = {};
      reports.forEach(report => {
        if (!reportsByTutor[report.reportedTutor]) {
          reportsByTutor[report.reportedTutor] = [];
        }
        if (report.message) {
          reportsByTutor[report.reportedTutor].push(report.message);
        }
      });

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

      const bannedSnapshot = await getDocs(collection(db, 'banned'));
      const bannedList = bannedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBannedTutors(bannedList);

      const bannedTutorIds = bannedList.map(b => b.tutorId);
      const filteredReportedTutors = reportedTutorsList.filter(
        tutor => !bannedTutorIds.includes(tutor.id)
      );
      setReportedTutors(filteredReportedTutors);

    } catch (error) {
      console.error('Fetch error:', error);
      setStudents([]);
      setTutors([]);
      setReportedTutors([]);
      setBannedTutors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
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
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.name} ({item.email})</Text>
                <View style={{ marginTop: 4 }}>
                  {item.reportMessages.map((msg, idx) => (
                    <Text key={idx} style={{ color: 'red', fontSize: 14 }}>
                      Report: {msg}
                    </Text>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.banButton}
                onPress={() => handleBanTutor(item)}
              >
                <Text style={styles.banButtonText}>Ban</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.header}>Banned Tutors</Text>
        {bannedTutors.map(item => (
          <View style={styles.userCard} key={item.tutorId || item.id}>
            <Text style={styles.userName}>
              {item.name} ({item.email})
            </Text>
            <TouchableOpacity
              style={styles.unbanButton}
              onPress={() => handleUnbanTutor(item)}
            >
              <Text style={styles.unbanButtonText}>Unban</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  userCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userName: { fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  banButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  unbanButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  unbanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminHomePage;
