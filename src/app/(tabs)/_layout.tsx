import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <AppTabBar />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Главная' }} />
      <Tabs.Screen name="inventory" options={{ title: 'Запасы' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Аналитика' }} />
      <Tabs.Screen name="shopping" options={{ title: 'Покупки' }} />
    </Tabs>
  );
}
