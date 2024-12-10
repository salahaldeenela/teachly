import { Pressable, Text } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Pressable
            onPress={toggleTheme}
            className="p-4"
        >
            <Text className={`${theme === 'light'
                ? 'text-light-text-primary '
                : 'text-dark-text-primary '
                }`}>
                Toggle Theme ({theme})
            </Text>
        </Pressable>
    );
}