import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export const fetchTutors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const tutorsOnly = allUsers.filter(user => user.userType === 'tutor');
    console.log(tutorsOnly);
    return tutorsOnly;
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return []; // return empty array on error
  }
};

export const fetchUpcomingSessions = async (studentId) => {
  return [
    { id: 's1', time: '2025-04-22 10:00 AM', tutor: 'John Doe' },
    { id: 's2', time: '2025-04-24 2:00 PM', tutor: 'Jane Smith' },
  ];
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


