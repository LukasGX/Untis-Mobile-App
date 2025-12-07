import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import "react-native-get-random-values";

const TabsLayout = () => {
	const [hasSpecialPermission, setHasSpecialPermission] =
		useState<boolean>(false);

	const [usesGradeManagement, setUsesGradeManagement] =
		useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const permission = await SecureStore.getItemAsync(
					"specialPermissionOwning"
				);
				if (isMounted) {
					setHasSpecialPermission(permission === "true");
				}
			} catch {}

			try {
				const usesGM = await SecureStore.getItemAsync(
					"usingGradeManagement"
				);
				if (isMounted) {
					setUsesGradeManagement(usesGM === "true");
				}
			} catch {}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#fcba03",
				tabBarInactiveTintColor: "#777",
				tabBarStyle: { backgroundColor: "#fff" },
				tabBarIconStyle: { marginBottom: 2 }
			}}>
			<Tabs.Screen
				name="index"
				options={{
					title: "Start",
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={focused ? "home" : "home-outline"}
							size={size}
							color={color}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name="timetable"
				options={{
					title: "Stundenplan",
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={focused ? "calendar" : "calendar-outline"}
							size={size}
							color={color}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Mitteilungen",
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={
								focused ? "chatbubbles" : "chatbubbles-outline"
							}
							size={size}
							color={color}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Einstellungen",
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={focused ? "settings" : "settings-outline"}
							size={size}
							color={color}
						/>
					)
				}}
			/>

			<Tabs.Screen
				name="gradeManagement"
				options={{
					title: "Notenverwaltung",
					href: usesGradeManagement
						? "/(tabs)/gradeManagement"
						: null,
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={focused ? "clipboard" : "clipboard-outline"}
							size={size}
							color={color}
						/>
					)
				}}
			/>

			<Tabs.Screen
				name="special"
				options={{
					title: "Spezial",
					href: hasSpecialPermission ? "/(tabs)/special" : null,
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							style={styles.icon}
							name={focused ? "star" : "star-outline"}
							size={size}
							color={color}
						/>
					)
				}}
			/>

			{/* HIDDEN */}
			<Tabs.Screen
				name="addGrade"
				options={{
					href: null
				}}
			/>
		</Tabs>
	);
};

export default TabsLayout;

const styles = StyleSheet.create({
	icon: {
		marginBottom: 2
	}
});
