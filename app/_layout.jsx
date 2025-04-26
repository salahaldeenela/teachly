import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { AuthContextProvider, useAuth } from '../context/authContext';
const Mainlayout = () => {
  const { isAuth } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const inApp = segments[0] === '(app)';

    if (isAuth && !inApp && pathname !== '/Home') {
      router.replace('/Tabs/Home');
    } else if (
      !isAuth &&
      pathname !== '/signIn' &&
      pathname !== '/signUp' &&
      pathname !== '/selectProvince' &&
      pathname !== '/selectGrade'
    ) {
      router.replace('/signIn');
    }
  }, [isAuth, segments, pathname]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <MenuProvider>
      <AuthContextProvider>
        <Mainlayout />
      </AuthContextProvider>
    </MenuProvider>
  );
}
