import React from 'react';
import {useAuth} from '../../../context/authContext';
import StudentCalender from '../UsersPages/StudentCalenderPage';
import TutorCalender from '../UsersPages/TutorCalenderPage';

const Calendar = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.userType === 'student') {
    return <StudentCalender />;
  }

  if (user.userType === 'tutor') {
    return <TutorCalender />;
  }

  return null;
};

export default Calendar;
