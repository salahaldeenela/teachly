import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');

    useEffect(() => {
        setTheme(systemColorScheme || 'light');
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setTheme(current => current === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}