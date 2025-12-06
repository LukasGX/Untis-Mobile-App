import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const stored = await loadCredentials();
				if (!stored) {
					if (isMounted) setError("Nicht eingeloggt");
					return;
				}
				const untis = new WebUntis(
					stored.school,
					stored.user,
					stored.password,
					stored.host
				);
				await untis.login();
				setSchool(untis.school);
				setUserName(untis.username);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Notenverwaltung</Text>

				<View style={styles.container}>
					<Text style={sharedStyles.errorTextNoMargin}>
						Keine Daten
					</Text>
				</View>

				<TouchableOpacity
					style={[sharedStyles.button, { marginHorizontal: 20 }]}
					onPress={() => router.replace("/(tabs)/addGrade")}>
					<Text style={{ textAlign: "center" }}>Note eintragen</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default GradeManagementIndex;

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 0,
		padding: 24,
		borderRadius: 12,
		backgroundColor: "#f9f9f9",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		marginBottom: 20
	}
});
