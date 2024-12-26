import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const Index = () => {
    const { theme } = useTheme();
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1">
            <View className={`flex-1 px-4 ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
                <View className="flex-1 gap-5 py-8 justify-center items-center">
                    <View className="items-center">
                        <ThemeToggle />
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

                    <View className="gap-4">
                        <Button
                            onPress={() => router.push('/(tabs)/home')}
                            title="Go to Tabs"
                            variant='secondary'

                        />

                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
};

export default Index;