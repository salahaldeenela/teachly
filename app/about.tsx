import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '@/components/Button'
import { router } from 'expo-router'
import { useTheme } from '@/context/ThemeProvider'
import { StatusBar } from 'expo-status-bar'

export default function about() {

    const { theme } = useTheme();

    return (



        <View className={`flex-1 px-4 ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
            <View className="flex-1 gap-5 py-8 justify-center items-center">
                <View className="items-center">

                </View>
                <View className="gap-4">
                    <Button
                        onPress={() => router.push('/about' as any)}
                        title="Go to About Page"
                        variant='primary'

                    />

                </View>
                <View className="gap-4">
                    <Button
                        onPress={() => router.push('/not-found' as any)}
                        title="Go to not found "
                        variant='ghost'

                    />

                </View>

            </View>
        </View>


    )
}

const styles = StyleSheet.create({})