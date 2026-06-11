import { View } from 'react-native';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/theme/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Head>
        <title>SudokuZ — 6×6 Sudoku</title>
        <meta name="description" content="A fast, clean 6×6 sudoku you can play in minutes." />
        <meta name="theme-color" content={colors.bg} />
      </Head>
      <StatusBar style="light" />
      {fontsLoaded && (
        <AuthProvider>
          <Slot />
        </AuthProvider>
      )}
    </View>
  );
}
