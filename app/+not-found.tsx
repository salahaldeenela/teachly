import { Link, router, Stack } from 'expo-router';
import { SafeAreaView, SafeAreaViewBase, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import Button from '@/components/Button';

export default function NotFoundScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        className={`
          flex-1 items-center justify-center p-5
  
        `}
      >
        <Text
          className={`
            ${theme === 'light'
              ? 'text-light-text-primary'
              : 'text-dark-text-primary'
            }
          `}
        >Opps! This screen doesn't exist.</Text>
      </View>

    </SafeAreaView >
  );
}