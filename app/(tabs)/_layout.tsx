import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

const TabsLayout = () => {
	const [hasSpecialPermission, setHasSpecialPermission] =
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
				tabBarIconStyle: { marginBottom: 2 } // small upward shift if labels drop
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

			{hasSpecialPermission && (
				<Tabs.Screen
					name="special"
					options={{
						title: "Spezial",
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
			)}
		</Tabs>
	);
};

export default TabsLayout;

const styles = StyleSheet.create({
	icon: {
		marginBottom: 2 // negative pulls icon slightly up; change to positive for gap pushing label down
	}
});
