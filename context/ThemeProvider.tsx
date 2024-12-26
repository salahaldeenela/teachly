import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemTheme = useColorScheme() as Theme
    const [theme, setTheme] = useState<Theme>(systemTheme || 'light')

    // Immediately respond to system theme changes
    useEffect(() => {
        setTheme(systemTheme || 'light')
    }, [systemTheme])

    const toggleTheme = async () => {
        try {
            const newTheme = theme === 'light' ? 'dark' : 'light'
            setTheme(newTheme)
            await AsyncStorage.setItem('theme', newTheme)
        } catch (error) {
            console.error('Error saving theme:', error)
        }
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}