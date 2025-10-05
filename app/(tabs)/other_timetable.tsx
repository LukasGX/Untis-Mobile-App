import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebUntis } from "webuntis";

// TODO: Move credentials to a secure location (env variables / secure store). Hardcoding is insecure.
const credentials = {
	school: "",
	user: "",
	password: "",
	host: "",
};

const OtherTimetable = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const untis = new WebUntis(credentials.school, credentials.user, credentials.password, credentials.host);
				await untis.login();
				if (isMounted) setSchool(untis.school);
				if (isMounted) setUserName(untis.username);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View>
			<Text style={styles.heading}>Untis+</Text>
			<View style={styles.container}>
				<Text style={styles.semiheading}>Andere Stundenpläne</Text>
			</View>
		</View>
	);
};

export default OtherTimetable;

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
