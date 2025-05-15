import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { getDocs, collection,query,where,doc,getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export const fetchTutors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const tutorsOnly = allUsers.filter(user => user.userType === 'tutor');
   // console.log(tutorsOnly);
    return tutorsOnly;
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return []; // return empty array on error
  }
};


export const fetchEnrolledStudents = async (tutorId) => {
  return [
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
};


export const fetchAvailableSessions = async (tutorId = null) => {
  let query = collection(db, 'sessions');
  if (tutorId) {
    query = query.where('tutorId', '==', tutorId);
  }
  query = query.where('status', '==', 'open');
  
  const snapshot = await getDocs(query);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// For tutors to see their sessions
export const fetchTutorSessions = async (tutorId) => {
  try {
    if (!tutorId) throw new Error('Tutor ID is required');

    // Get all student documents
    const studentsSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        where('userType', '==', 'student')
      )
    );

    // Process all booked sessions across students
    const allSessions = studentsSnapshot.docs.flatMap(studentDoc => {
      const studentData = studentDoc.data();
      const bookedSessions = studentData.bookedSessions || [];

      return bookedSessions
        .filter(session => session.tutorId === tutorId)
        .map(session => ({
          ...session,
          studentId: studentDoc.id,
          studentName: studentData.name || studentData.username,
          studentEmail: studentData.email,
          studentProvince: studentData.province,
          // Convert string dates to Date objects
          bookedAt: new Date(session.bookedAt),
          createdAt: new Date(session.createdAt),
          sessionDate: new Date(session.date),
          // Add tutor information from session
          tutorName: session.tutorName,
          tutorId: session.tutorId
        }));
    });

    // Sort sessions by booking date (newest first)
    return allSessions.sort((a, b) => b.bookedAt - a.bookedAt);

  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    throw new Error('Failed to fetch sessions. Please try again later.');
  }
};

// For students to see their booked sessions
export const fetchStudentSessions = async (studentId) => {
  try {
    const studentRef = doc(db, 'users', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    
    // Return the bookedSessions array if it exists, or empty array
    return studentData.bookedSessions?.map(session => ({
      ...session,
      // Convert string dates to Date objects if needed
      bookedAt: new Date(session.bookedAt),
      createdAt: new Date(session.createdAt)
    })) || [];
    
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    throw error;
  }
};