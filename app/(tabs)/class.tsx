import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Student, WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

type ExtraConfig = {
	apiToken?: string;
};

const ClassView = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [untis, setUntis] = useState<any>();

	const [students, setStudents] = useState<Student[]>([]);

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
				setUntis(untis);

				const students = await untis.getStudents();
				setStudents(students);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	const getContactData = async (student: string) => {
		const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;
		const API_TOKEN: string = extra.apiToken ?? "";

		const contact = await fetch(
			`http://217.154.161.106:8000/get_contact/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": API_TOKEN
				},
				body: JSON.stringify({
					school: school,
					username: student
				})
			}
		);

		return contact;
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Meine Schule</Text>
				{students.map((student: any) => (
					<View key={student.id} style={styles.student}>
						<Text style={styles.studentName}>
							{student.foreName} {student.longName}
						</Text>
						<TouchableOpacity style={styles.requestDataTouch}>
							<Ionicons
								name={"chatbubble-outline"}
								style={styles.requestData}
							/>
						</TouchableOpacity>
					</View>
				))}
			</View>
		</View>
	);
};

export default ClassView;

const styles = StyleSheet.create({
	student: {
		marginBottom: 16,
		padding: 12,
		backgroundColor: "#f9f9f9",
		borderRadius: 8
	},
	studentName: {},
	requestDataTouch: {
		position: "absolute",
		top: "50%",
		right: 10
	},
	requestData: {
		fontSize: 20
	}
});
