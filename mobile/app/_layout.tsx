import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getUser } from '../utils/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

export default function RootLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const navigated = useRef(false);

  useEffect(() => {
    getUser().then(user => {
      setChecking(false);
      if (!user && !navigated.current) {
        navigated.current = true;
        setTimeout(() => router.replace('/login'), 60);
      }
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#03091A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="result" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </QueryClientProvider>
  );
}
