import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { styled } from 'nativewind';
import Button from '@/components/Button';
import { router } from 'expo-router';

const StyledView = styled(View);
const StyledText = styled(Text);

const NotFound = () => {
  const { theme } = useTheme();

  return (
    <StyledView className={`flex-1 justify-center items-center ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
      <StyledText className={`text-6xl font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
        404
      </StyledText>

      <StyledText className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
        This screen doesn't exist.
      </StyledText>

      <StyledText className={`mb-6 text-center ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
        You can go back home or try using the navigation.
      </StyledText>


      <Button
        onPress={() => router.push('/' as any)}
        title="Go back home"
      />


    </StyledView>
  );
};

export default NotFound;