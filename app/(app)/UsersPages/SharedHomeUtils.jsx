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
  try {
    if (!tutorId) throw new Error('Tutor ID is required');

    // Get all students who have sessions with this tutor
    const studentsSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        where('userType', '==', 'student')
      )
    );

    const enrolledStudents = studentsSnapshot.docs
      .map(studentDoc => {
        const studentData = studentDoc.data();
        const allSessions = studentData.bookedSessions || [];
        
        // Filter sessions for this tutor
        const tutorSessions = allSessions.filter(session => 
          session.tutorId === tutorId && session.status === 'booked'
        );

        if (tutorSessions.length === 0) return null;

        // Get unique subjects from sessions
        const subjects = [...new Set(tutorSessions.map(s => s.subject))];
        
        // Format sessions data
        const sessions = tutorSessions.map(session => ({
          subject: session.subject,
          time: session.time,
          date: new Date(session.date),
          duration: session.duration,
          bookedAt: new Date(session.bookedAt),
          sessionId: session.id
        }));

        return {
          id: studentDoc.id,
          name: studentData.name || studentData.username || 'Unknown Student',
          email: studentData.email,
          province: studentData.province,
          subjects,
          sessions,
          totalSessions: tutorSessions.length,
          lastSession: sessions.sort((a, b) => b.date - a.date)[0]
        };
      })
      .filter(student => student !== null)
      .sort((a, b) => b.totalSessions - a.totalSessions); // Sort by most active

    return enrolledStudents;

  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    throw new Error('Failed to fetch enrolled students');
  }
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

    const tutorDocRef = doc(db, 'users', tutorId);
    const tutorDocSnap = await getDoc(tutorDocRef);

    const sessionMap = new Map(); // To track unique sessions

    // 1. Get unbooked sessions from tutor's document
    if (tutorDocSnap.exists()) {
      const tutorData = tutorDocSnap.data();
      const tutorSessions = tutorData.sessions || [];

      tutorSessions.forEach(session => {
        const sessionKey = `${session.date}_${session.time}_${tutorId}`;
        sessionMap.set(sessionKey, {
          ...session,
          tutorId,
          tutorName: tutorData.name || tutorData.username || 'Unknown Tutor',
          bookedAt: session.bookedAt ? new Date(session.bookedAt) : null,
          createdAt: session.createdAt ? new Date(session.createdAt) : null,
          sessionDate: session.date ? new Date(session.date) : null,
          studentId: null,
          studentName: null,
          studentEmail: null,
          studentProvince: null,
        });
      });
    }

    // 2. Get booked sessions from students
    const studentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('userType', '==', 'student'))
    );

    studentsSnapshot.docs.forEach(studentDoc => {
      const studentData = studentDoc.data();
      const bookedSessions = studentData.bookedSessions || [];

      bookedSessions.forEach(session => {
        if (session.tutorId !== tutorId) return;

        const sessionKey = `${session.date}_${session.time}_${session.tutorId}`;
        sessionMap.set(sessionKey, {
          ...session,
          studentId: studentDoc.id,
          studentName: studentData.name || studentData.username,
          studentEmail: studentData.email,
          studentProvince: studentData.province,
          bookedAt: new Date(session.bookedAt),
          createdAt: new Date(session.createdAt),
          sessionDate: new Date(session.date),
          tutorName: session.tutorName,
          tutorId: session.tutorId,
        });
      });
    });

    // 3. Convert map to array and sort
    const allSessions = Array.from(sessionMap.values());

    allSessions.sort((a, b) => {
      if (!a.bookedAt) return 1;
      if (!b.bookedAt) return -1;
      return b.bookedAt - a.bookedAt;
    });

    return allSessions;

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