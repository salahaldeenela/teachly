import React from 'react';
import { useAuth } from '../../../context/authContext';
import StudentHomePage from '../UsersPages/StudentHomePage';
import TutorHomePage from '../UsersPages/TutorHomePage';
import AdminHomePage from '../AdminPages/AdminHomePage';

const Home = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.userType === 'student') {
    return <StudentHomePage />;
  }

  if (user.userType === 'tutor') {
    return <TutorHomePage />;
  }

    if (user.userType === 'admin') {
    return <AdminHomePage />;
  }
    
  return null;
};

export default Home;
