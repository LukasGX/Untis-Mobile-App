import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const TabsLayout = () => {
	return (
		<Tabs>
			<Tabs.Screen name="index" options={{ headerShown: false, title: "Start" }}></Tabs.Screen>
			<Tabs.Screen name="timetable" options={{ headerShown: false, title: "Mein Stundenplan" }}></Tabs.Screen>
			<Tabs.Screen name="other_timetable" options={{ headerShown: false, title: "Andere Stundenpläne" }}></Tabs.Screen>
			<Tabs.Screen name="messages" options={{ headerShown: false, title: "Mitteilungen" }}></Tabs.Screen>
		</Tabs>
	);
};

export default TabsLayout;

const styles = StyleSheet.create({});
