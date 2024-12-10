// import { Pressable, StyleSheet, Text, Touchable, TouchableOpacity, useColorScheme, View } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import { Link, router } from 'expo-router'

// export default function App() {
//     // Get system theme
//     const systemColorScheme = useColorScheme();
//     // State to store current theme
//     const [theme, setTheme] = useState(systemColorScheme);

//     // Update theme when system theme changes
//     useEffect(() => {
//         setTheme(systemColorScheme);
//     }, [systemColorScheme]);

//     // Toggle theme function
//     const toggleTheme = () => {
//         setTheme(current => current === 'light' ? 'dark' : 'light');
//     };

//     return (
//         <Pressable onPress={toggleTheme} className="flex-1">
//             <View className={`flex-1 items-center justify-center ${theme === 'light' ? 'bg-light-background' : 'bg-dark-background'
//                 }`}>
//                 <Text className={`${theme === 'light' ? 'text-light-text-primary' : 'text-dark-text-primary'
//                     }`}>
//                     Tap anywhere to change theme
//                 </Text>
//                 <Text className={`mt-2 ${theme === 'light' ? 'text-light-text-secondary' : 'text-dark-text-secondary'
//                     }`}>
//                     Current theme: {theme}
//                 </Text>


//                 <TouchableOpacity onPress={() => {
//                     router.push('/not-found' as any)
//                 }}>
//                     <Text>Go to not found</Text>
//                 </TouchableOpacity>
//             </View>
//         </Pressable>
//     )
// }

// const styles = StyleSheet.create({})




import { SafeAreaView, View } from 'react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeProvider';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


export default function App() {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View className={`flex-1 items-center justify-center ${theme === 'light' ? 'bg-light-background' : 'bg-dark-background'
                }`}>
                <ThemeToggle />

                <Button onPress={() => {
                    router.push('/not-found' as any)
                }} title="Go to not found" />


            </View>

            <StatusBar style='auto' />
        </SafeAreaView>
    );
}