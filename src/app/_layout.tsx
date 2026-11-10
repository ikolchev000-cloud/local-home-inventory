import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { PackageOpen } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { InventoryProvider, useInventory } from '@/context/InventoryContext';
import { Toast } from '@/components/Toast';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <InventoryProvider>
        <AppNavigator />
      </InventoryProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { isHydrated } = useInventory();
  if (!isHydrated) return <LoadingScreen />;
  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="product-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <Toast />
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <View style={styles.logo}><PackageOpen size={30} color={colors.ink} /></View>
      <Text style={styles.brand}>полка</Text>
      <ActivityIndicator color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: colors.background },
  logo: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink, marginBottom: 12, letterSpacing: -1 },
});
