import React from 'react';
import { styled } from 'nativewind';
import { Pressable as RNPressable } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { Feather } from '@expo/vector-icons';

const Pressable = styled(RNPressable);

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Pressable
            onPress={toggleTheme}
            className={`p-3 rounded-full ${theme === 'dark' ? 'bg-dark-surface' : 'bg-light-surface'}`}
        >
            <Feather
                name={theme === 'dark' ? 'moon' : 'sun'}
                size={24}
                color={theme === 'dark' ? 'hsl(0 0% 90%)' : 'hsl(220 10% 20%)'}
            />
        </Pressable>
    );
}