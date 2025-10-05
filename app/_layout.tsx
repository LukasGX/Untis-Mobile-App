import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const RootLayout = () => {
	return (
		<Stack>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
		</Stack>
	);
};

export default RootLayout;

const styles = StyleSheet.create({
	container: {
		padding: 10,
	},
	heading: {
		fontSize: 30,
		backgroundColor: "#fcba03",
		padding: 10,
		textAlign: "center",
	},
	semiheading: {
		fontSize: 20,
		padding: 10,
		textAlign: "center",
		marginBottom: 40,
	},
	button: {
		fontSize: 15,
		backgroundColor: "#ffcb3dff",
		padding: 10,
		borderRadius: 8,
		textAlign: "center",
		marginBottom: 10,
	},
	error: {
		color: "#b00020",
		marginTop: 8,
		textAlign: "center",
	},
});
