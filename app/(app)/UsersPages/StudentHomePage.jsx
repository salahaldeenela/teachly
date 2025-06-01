import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../../../context/authContext';
import SearchAndFilter from '../../../components/SearchAndFilter';
import { fetchTutors } from './SharedHomeUtils';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getDoc,
  setDoc,
  Timestamp,
  getDocs,
  collection,
} from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getRoomId } from '../../../assets/data/data';

const StudentHomePage = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [allTutors, setAllTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const tutorsData = await fetchTutors();
      setAllTutors(tutorsData);
      setFilteredTutors(tutorsData);
    } catch (error) {
      console.error('Error refreshing tutors:', error);
      Alert.alert('Error', 'Failed to refresh tutors');
    } finally {
      setRefreshing(false);
    }
  };

  const formatMembershipDate = (timestamp) => {
  if (!timestamp) return 'Not available';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const options = { year: 'numeric', month: 'long' };
  return `Member since ${date.toLocaleDateString(undefined, options)}`;
};

  const submitReview = async () => {
  if (reviewRating < 1 || reviewRating > 5 || !reviewText) {
    Alert.alert('Missing fields', 'Please choose a rating and write a review.');
    return;
  }

  try {
    setSubmittingReview(true);

    const tutorRef = doc(db, 'users', selectedTutor.id);
    const review = {
      rating: parseInt(reviewRating),
      comment: reviewText,
      createdAt: new Date().toISOString(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Anonymous',
    };
    
    await updateDoc(tutorRef, {
      reviews: arrayUnion(review),
    });
    // await updateDoc(tutorRef, {
    //   reviews: arrayUnion(review),
    // });

    setSelectedTutor((prev) => ({
      ...prev,
      reviews: [...(prev.reviews || []), review],
    }));

    setReviewText('');
    setReviewRating('');

  } catch (error) {
    console.error('Error submitting review:', error);
    Alert.alert('Error', 'Failed to submit review.');
  } finally {
    setSubmittingReview(false);
  }
};


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;

      try {
        setTutorsLoading(true);
        const tutorsData = await fetchTutors();
        setAllTutors(tutorsData);
        setFilteredTutors(tutorsData);
      } catch (error) {
        console.error('Error loading tutors:', error);
        Alert.alert('Error', 'Failed to load tutors');
      } finally {
        setTutorsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const submitReport = async () => {
  if (!user || !selectedTutor) return;

  if (!reportMessage.trim()) {
    Alert.alert('Missing message', 'Please write a message before submitting the report.');
    return;
  }

  try {
    setSubmittingReport(true);

    const reportData = {
      reportedBy: user.uid,
      reportedTutor: selectedTutor.id,
      message: reportMessage.trim(),
      createdAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(doc(collection(db, 'reports')), reportData);

    setReportMessage('');
    setShowReportInput(false);

  } catch (error) {
    console.error('Error submitting report:', error);
    Alert.alert('Error', 'Failed to submit report.');
  } finally {
    setSubmittingReport(false);
  }
};

  const handleBookSession = async (tutorId, sessionId) => {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to book a session');
      }

      const tutorRef = doc(db, 'users', tutorId);
      const studentRef = doc(db, 'users', currentUser.uid);

      const [tutorDoc, studentDoc] = await Promise.all([
        getDoc(tutorRef),
        getDoc(studentRef),
      ]);

      if (!tutorDoc.exists()) throw new Error('Tutor not found');

      const tutorData = tutorDoc.data();
      const sessionToBook = tutorData.sessions?.find((s) => s.id === sessionId);
      if (!sessionToBook) throw new Error('Session not found');

      const studentData = studentDoc.data() || {};
      if (studentData.bookedSessions?.some((s) => s.id === sessionId)) {
        throw new Error('You have already booked this session');
      }

      const batch = writeBatch(db);

      batch.update(tutorRef, {
        sessions: arrayRemove(sessionToBook),
      });

      const bookedSession = {
        ...sessionToBook,
        tutorId,
        tutorName: tutorData.displayName || tutorData.name || 'Tutor',
        studentId: currentUser.uid,
        studentName: currentUser.displayName || 'Student',
        status: 'booked',
        bookedAt: new Date().toISOString(),
      };

      batch.update(studentRef, {
        bookedSessions: arrayUnion(bookedSession),
      });

      await batch.commit();

      setSelectedTutor((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      }));

      Alert.alert('Success', 'Session booked successfully!');
    } catch (error) {
      console.error('Error booking session:', error);
      Alert.alert('Error', error.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }

    // Room creation logic should be outside the above try/catch
    try {
      const roomid = getRoomId(user.uid, tutorId);
      const querySnapshot = await getDocs(collection(db, 'rooms'));

      let roomExists = false;

      querySnapshot.forEach((doc) => {
        if (doc.id === roomid) {
          roomExists = true;
          // You can break out here if you use a for...of loop instead of forEach
        }
      });

      if (roomExists) {
        // Do nothing (or just return)
        console.log('Room already exists, doing nothing.');
        return;
      } else {
        // Room doesn't exist, do something here
        console.log("Room doesn't exist, you can create it.");
        await setDoc(doc(db, 'rooms', roomid), {
          roomid,
          time: Timestamp.fromDate(new Date()),
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', error.message || 'Failed to create room');
    }
  };

  const renderTutorProfile = () => {
    if (!selectedTutor) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.title}>{selectedTutor.name}'s Profile</Text>
        <Text style={styles.membershipText}>
          {formatMembershipDate(selectedTutor.createdAt)}
        </Text>
        <Text>Gender: {selectedTutor.gender || 'Not specified'}</Text>
        <Text>Subjects: {getSubjectsFromTutor(selectedTutor)}</Text>
        <Text>Province: {selectedTutor.province || 'Not specified'}</Text>
        <Text>Experince: {selectedTutor.experince || 'Not specified'}</Text>


        <Text style={styles.subHeader}>Available Sessions:</Text>

        {selectedTutor.sessions?.filter((s) => s.status === 'available')
          .length > 0 ? (
          selectedTutor.sessions
            .filter((session) => session.status === 'available')
            .map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <Text style={styles.sessionTitle}>{session.subject}</Text>
                  <Text>Date: {session.date}</Text>
                  <Text>Time: {session.time}</Text>
                  <Text>Duration: {session.duration} hour(s)</Text>
                  <Text>Price: {session.price} JD</Text>
                </Card.Content>
                <Card.Actions>
                  <Button
                    mode="contained"
                    onPress={() =>
                      handleBookSession(selectedTutor.id, session.id)
                    }
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Booking...' : 'Book Session'}
                  </Button>
                </Card.Actions>
              </Card>
            ))
        ) : (
          <Text>No available sessions</Text>
        )}

        <Text style={styles.subHeader}>Leave a Review</Text>

        {!showReviewInput ? (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReviewInput(true)}
          >
            <Text style={styles.reportButtonText}>✍️ Leave a Review</Text>
          </TouchableOpacity>
        ) : (
            <View style={{ marginTop: 10 }}>
              <View style={styles.starsContainer}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  Your Rating
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                    >
                      <Text
                        style={
                          reviewRating >= star ? styles.filledStar : styles.emptyStar
                        }
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            <TextInput
              style={[styles.input, { height: 80, marginTop: 10 }]}
              placeholder="Write your review..."
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />

            <Button
              mode="contained"
              onPress={submitReview}
              disabled={submittingReview}
              style={{ marginTop: 10 }}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>

            <TouchableOpacity
              onPress={() => {
                setShowReviewInput(false);
                setReviewText('');
                setReviewRating(0);
              }}
            >
              <Text style={{ color: 'red', marginTop: 8 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={{ fontWeight: 'bold', marginTop: 20, marginBottom: 8 }}>
          Reviews
        </Text>
        {selectedTutor.reviews?.length > 0 ? (
          selectedTutor.reviews.map((review, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.reviewRating}>⭐ {review.rating}/5</Text>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={{ fontStyle: 'italic', color: 'gray' }}>
                — {review.userName || 'Anonymous'}
              </Text>
            </View>
          ))
        ) : (
          <Text>No reviews yet.</Text>
        )}

        <Text style={styles.subHeader}>Report</Text>

        {!showReportInput ? (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportInput(true)}
          >
            <Text style={styles.reportButtonText}>🚩 Report This Tutor</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginVertical: 10 }}>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Describe the issue here..."
              multiline
              value={reportMessage}
              onChangeText={setReportMessage}
            />
            <Button
              mode="contained"
              onPress={submitReport}
              disabled={submittingReport}
              style={{ marginTop: 8 }}
            >
              {submittingReport ? 'Submitting...' : 'Submit Report'}
            </Button>
            <TouchableOpacity
              onPress={() => {
                setShowReportInput(false);
                setReportMessage('');
              }}
            >
              <Text style={{ color: 'red', marginTop: 8 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button
          onPress={() => setSelectedTutor(null)}
          mode="outlined"
          style={styles.backButton}
          disabled={loading}
        >
          Back to Tutors
        </Button>
      </View>
    );
  };

  const getSubjectsFromTutor = (tutor) => {
    if (!tutor?.grade) return 'No subjects listed';

    try {
      let grades = tutor.grade;
      if (!Array.isArray(grades)) {
        grades = Object.entries(grades).map(([grade, subjects]) => ({
          grade,
          subjects: Array.isArray(subjects) ? subjects : [],
        }));
      }

      const allSubjects = grades.flatMap((g) => g.subjects || []);
      return allSubjects.length > 0
        ? allSubjects.join(', ')
        : 'No subjects listed';
    } catch (error) {
      console.error('Error processing subjects:', error);
      return 'Error loading subjects';
    }
  };

  if (!authChecked) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (selectedTutor) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>{renderTutorProfile()}</View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={styles.header}>
          Welcome {user?.displayName || 'Student'}
        </Text>

        <SearchAndFilter
          tutorsData={allTutors}
          onResultsFiltered={setFilteredTutors}
        />

        <Text style={styles.subHeader}>Explore Tutors</Text>

        {tutorsLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : filteredTutors.length > 0 ? (
          filteredTutors.map((tutor) => (
            <TouchableOpacity
              key={tutor.id}
              onPress={() => setSelectedTutor(tutor)}
              disabled={tutorsLoading}
            >
              <Card style={styles.card}>
                <Card.Title
                  title={tutor.name || 'No name'}
                  subtitle={`${tutor.province || 'Location not specified'} `}
                />
                <Card.Content>
                  <Text>Teaches: {getSubjectsFromTutor(tutor)}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No tutors found in your area.</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  card: {
    marginBottom: 10,
    padding: 10,
  },
  section: {
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  sessionCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  loader: {
    marginVertical: 20,
  },
  reportButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  reviewItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  reviewRating: {
    fontWeight: 'bold',
  },
  reviewComment: {
    marginBottom: 4,
  },
  starsContainer: {
    marginBottom: 10,
  },
  filledStar: {
    fontSize: 30,
    color: '#FFD700',
    marginHorizontal: 3,
  },
  emptyStar: {
    fontSize: 30,
    color: '#ccc',
    marginHorizontal: 3,
  },
  membershipText: {
  fontSize: 12,
  color: '#888',
  marginBottom: 8,
},

});

export default StudentHomePage;
