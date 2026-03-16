import { Tabs } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function BetaHeaderRight() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, gap: 6 }}>
      <Text style={{ color: Colors.primary, fontSize: 9, fontWeight: '800', backgroundColor: 'rgba(221,85,12,0.15)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, overflow: 'hidden', letterSpacing: 0.5 }}>BETA</Text>
      <Text style={{ color: Colors.textMuted, fontSize: 11 }}>v{APP_VERSION}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          ...(Platform.OS === 'web' ? { paddingBottom: 8, height: 64 } : {}),
        },
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => <BetaHeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-stuff"
        options={{
          title: 'My Stuff',
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: 'Add Item',
          href: null,
        }}
      />
    </Tabs>
  );
}
