import { StyleSheet } from "react-native";

export const palette = {
	primary: "#fcba03",
	accent: "#ffcb3dff",
	error: "#b00020",
};

export const sharedStyles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	container: {
		padding: 10,
	},
	heading: {
		fontSize: 30,
		backgroundColor: palette.primary,
		padding: 20,
		textAlign: "center",
	},
	semiHeading: {
		fontSize: 20,
		padding: 10,
		textAlign: "center",
		marginBottom: 10,
	},
	button: {
		fontSize: 15,
		backgroundColor: palette.accent,
		padding: 10,
		borderRadius: 8,
		textAlign: "center",
		marginBottom: 10,
	},
	errorText: {
		color: palette.error,
		marginTop: 8,
		textAlign: "center",
	},
});
