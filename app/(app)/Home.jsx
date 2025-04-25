import React from 'react';
import { useAuth } from '../../context/authContext';
import StudentHomePage from './StudentHomePage';
import TutorHomePage from './TutorHomePage';

const Home = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.userType === 'student') {
    return <StudentHomePage />;
  }

  if (user.userType === 'tutor') {
    return <TutorHomePage />;
  }

  return null;
};

export default Home;
