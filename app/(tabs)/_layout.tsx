import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const TabsLayout = () => {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#fcba03",
				tabBarInactiveTintColor: "#777",
				tabBarStyle: { backgroundColor: "#fff" },
				tabBarIconStyle: { marginBottom: 2 }, // small upward shift if labels drop
			}}>
			<Tabs.Screen
				name="index"
				options={{
					title: "Start",
					tabBarIcon: ({ color, size, focused }) => <Ionicons style={styles.icon} name={focused ? "home" : "home-outline"} size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="timetable"
				options={{
					title: "Mein Stundenplan",
					tabBarIcon: ({ color, size, focused }) => <Ionicons style={styles.icon} name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="other_timetable"
				options={{
					title: "Andere Stundenpläne",
					tabBarIcon: ({ color, size, focused }) => <Ionicons style={styles.icon} name={focused ? "people" : "people-outline"} size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Mitteilungen",
					tabBarIcon: ({ color, size, focused }) => <Ionicons style={styles.icon} name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />,
				}}
			/>
		</Tabs>
	);
};

export default TabsLayout;

const styles = StyleSheet.create({
	icon: {
		marginBottom: 2, // negative pulls icon slightly up; change to positive for gap pushing label down
	},
});
