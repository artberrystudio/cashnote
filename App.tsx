import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import { useStore } from './src/store/useStore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RecordsScreen } from './src/screens/RecordsScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppContent() {
  const { isLoaded, loadRecords, saveError, clearSaveError } = useStore();
  const [fontsLoaded] = useFonts(Ionicons.font);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (saveError) {
      Alert.alert('⚠️ 저장 오류', saveError, [
        { text: '확인', onPress: clearSaveError },
      ]);
    }
  }, [saveError]);

  if (!isLoaded || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#F3F4F6',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 6,
            height: 64,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            if (route.name === 'Dashboard') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Records') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Statistics') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: '대시보드' }}
        />
        <Tab.Screen
          name="Records"
          component={RecordsScreen}
          options={{ tabBarLabel: '기록' }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ tabBarLabel: '통계' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: '설정' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
});
