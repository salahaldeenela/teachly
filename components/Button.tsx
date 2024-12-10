import { Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useTheme } from '@/context/ThemeProvider';

interface ButtonProps {
    onPress: () => void;
    title: string;
}

export default function Button({ onPress, title }: ButtonProps) {

    const { theme, toggleTheme } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${theme === 'dark' ? 'bg-red-500' : 'bg-light-primary'} px-4 py-2 rounded-lg`}
        >
            <Text className="text-white font-medium">
                {title}
            </Text>
        </TouchableOpacity>
    )
}