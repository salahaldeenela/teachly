import { createContext, useEffect, useState, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isAuth, setAuth] = useState(undefined);
  const [user, setUser] = useState(null);

  const [signUpInfo, setSignUpInfo] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'student',
    grade: {},
    province: '',
    rate: '',
    gender: '', // ✅ Gender added
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuth(true);
        setUser(user);
        updateUserData(user?.uid);
      } else {
        setAuth(false);
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const updateUserData = async (id) => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let data = docSnap.data();
      setUser((prevUser) => ({
        ...prevUser,
        username: data.username,
        userType: data.userType,
        userID: data.userID,
        gender: data.gender, // ✅ Include gender in user object
      }));
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const register = async () => {
    try {
      const {
        email,
        password,
        name,
        userType,
        province,
        grade,
        rate,
        gender, // ✅ Include gender
      } = signUpInfo;

      if (!name || !email || !password || !province || !userType || !gender) {
        return {
          success: false,
          message: 'Please complete all fields before registering.',
        };
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      const userDoc = {
        name,
        email,
        userType,
        province,
        grade,
        rate: userType === 'tutor' ? rate : null,
        gender, // ✅ Save gender
        userID: uid,
        username: name,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', uid), userDoc);

      return { success: true };
    } catch (e) {
      console.error('Registration error:', e.message);
      return { success: false, message: e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        register,
        isAuth,
        user,
        signUpInfo,
        setSignUpInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Hey, AuthContext is not available!');
  return value;
};
