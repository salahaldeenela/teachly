/* eslint-disable import/named */
import { initializeApp, getApp, getApps } from 'firebase/app';
// eslint-disable-next-line import/named
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAd9NQzSWaF0CVJvU2iKadbOfzWjDhQ8o8',
  authDomain: 'teachly-4ab73.firebaseapp.com',
  projectId: 'teachly-4ab73',
  storageBucket: 'teachly-4ab73.firebasestorage.app',
  messagingSenderId: '787025760092',
  appId: '1:787025760092:web:3dd3c943e45d85cd45fb99',
  measurementId: 'G-67XM4LX7W9',
};
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const usersRef = collection(db, 'users');
export const roomsRef = collection(db, 'rooms');
