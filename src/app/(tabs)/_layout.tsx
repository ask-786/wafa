import { TabBar } from '@/components/wafa/tab-bar';
import { useWafa } from '@/store/useWafa';
import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

export default function TabsLayout() {
  const hasLedger = useWafa((s) => s.ledger !== null);
  if (!hasLedger) return <Redirect href="/onboarding" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
