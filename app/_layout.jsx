import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { MenuProvider } from 'react-native-popup-menu';
import { AuthContextProvider, useAuth } from '../context/authContext';

const Mainlayout = () => {
  const { isAuth } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isAuth) {
      if (segments[0] !== '(app)') {
        router.replace('/Tabs/Home');
      }
    } else {
      if (
        pathname !== '/signIn' &&
        pathname !== '/signUp' &&
        pathname !== '/selectProvince' &&
        pathname !== '/selectGrade'
      ) {
        router.replace('/signIn');
      }
    }
  }, [isAuth, segments, pathname, router]);

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
