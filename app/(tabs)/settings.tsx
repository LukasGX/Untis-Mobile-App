import * as SecureStore from "expo-secure-store"; // expo-secure-store installieren
import React, { useEffect, useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";
import { supabase } from "../../utils/supabase";

const TIMETABLE_STYLE_KEY = "timetableStyle";
const SPECIAL_PERMISSION_REQUESTED_KEY = "specialPermissionRequested";
const SPECIAL_PERMISSION_REQUEST_PENDING_KEY =
	"specialPermissionRequestPending";

const Settings = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [name, setName] = useState<string | null>(null);
	const [type, setType] = useState<string | null>(null);
	const [id, setID] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [timetableStyle, setTimetableStyle] = useState<
		"style1" | "style2" | "style3"
	>("style1");
	const [specialPermissionRequested, setSpecialPermissionRequested] =
		useState<boolean>(false);
	const [hasSpecialPermission, setHasSpecialPermission] =
		useState<boolean>(false);

	// Lade Einstellungen beim Start
	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				// Credentials laden & login
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
				if (isMounted) {
					setSchool(untis.school);
					setUserName(untis.username);
					setID(untis.id);
					const students = await untis.getStudents();
					const teachers = await untis.getTeachers();
					const person =
						students.find((s) => s.id.toString() === untis.id) ||
						teachers.find((t) => t.id.toString() === untis.id);
					if (person) {
						setName(person.name);
						setType(
							students.find((s) => s.id.toString() === untis.id)
								? "Schüler"
								: "Lehrer"
						);
					}
				}

				// Load saved Settings
				const savedStyle = await SecureStore.getItemAsync(
					TIMETABLE_STYLE_KEY
				);
				if (
					savedStyle === "style1" ||
					savedStyle === "style2" ||
					savedStyle === "style3"
				) {
					if (isMounted) setTimetableStyle(savedStyle);
				}

				const requested = await SecureStore.getItemAsync(
					SPECIAL_PERMISSION_REQUESTED_KEY
				);
				if (requested === "true") {
					if (isMounted) setSpecialPermissionRequested(true);
				}
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	const onChangeTimetableStyle = async (
		style: "style1" | "style2" | "style3"
	) => {
		setTimetableStyle(style);
		await SecureStore.setItemAsync(TIMETABLE_STYLE_KEY, style);
	};

	const requestSpecialPermissions = async () => {
		Alert.alert(
			"Anfrage für spezielle Berechtigungen",
			"Wenn du die Anfrage absendest, werden folgende Daten an den Untis+ Entwickler gesendet:\n\n- Deine Schule\n- Dein Benutzername\n- Dein echter Name\n- Deine Rolle (Schüler oder Lehrer)\n\nDiese Daten werden ausschließlich dazu verwendet, um deine Anfrage zu bearbeiten. Es werden keine weiteren Daten gesammelt oder gespeichert.\n\nMöchtest du die Anfrage absenden?",
			[
				{
					text: "Nein",
					onPress: () => donotSendData(),
					style: "cancel"
				},
				{ text: "Ja", onPress: () => doSendData() }
			]
		);
	};

	const doSendData = async () => {
		setSpecialPermissionRequested(true);
		await SecureStore.setItemAsync(
			SPECIAL_PERMISSION_REQUESTED_KEY,
			"true"
		);

		await SecureStore.setItemAsync(
			SPECIAL_PERMISSION_REQUEST_PENDING_KEY,
			"true"
		);

		const { data, error } = await supabase.from("requests").insert([
			{
				school: school,
				username: username,
				name: name,
				type: type,
				status: "pending"
			}
		]);

		console.log(data, error);

		Alert.alert(
			"Anfrage gesendet",
			"Die Anfrage für spezielle Berechtigungen wurde gesendet und wird überprüft."
		);
	};
	const donotSendData = async () => {
		setSpecialPermissionRequested(false);
		await SecureStore.setItemAsync(
			SPECIAL_PERMISSION_REQUESTED_KEY,
			"false"
		);

		Alert.alert(
			"Anfrage abgebrochen",
			"Die Anfrage für spezielle Berechtigungen wurde abgebrochen."
		);
	};

	const gradeManagementHandler = () => {
		Alert.alert(
			"Notenverwaltung verwalten",
			"Die Noten werden von Untis+ auf diesem Gerät gespeichert und niemals weitergegeben.\n\nMöchtest du die Notenverwaltung aktivieren?",
			[
				{
					text: "Deaktivieren",
					onPress: () => doNotOpenGradeManagement(),
					style: "cancel"
				},
				{ text: "Aktivieren", onPress: () => openGradeManagement() }
			]
		);
	};

	const openGradeManagement = async () => {
		await SecureStore.setItemAsync("usingGradeManagement", "true");
		Alert.alert(
			"Notenverwaltung aktiviert",
			"Du hast die Notenverwaltung aktiviert.\n\nDu kannst sie jederzeit wieder deaktivieren."
		);
	};

	const doNotOpenGradeManagement = async () => {
		await SecureStore.setItemAsync("usingGradeManagement", "false");
		Alert.alert(
			"Notenverwaltung deaktiviert",
			"Du hast die Notenverwaltung deaktiviert."
		);
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<ScrollView style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Einstellungen</Text>

				<Text style={styles.heading}>Aussehen des Stundenplans</Text>
				<TouchableOpacity
					style={[
						styles.option,
						timetableStyle === "style1" && styles.selectedOption
					]}
					onPress={() => onChangeTimetableStyle("style1")}>
					<Text>Standard</Text>
				</TouchableOpacity>

				<Pressable
					key={"example1"}
					style={[
						stylesDesign1.block,
						stylesDesign1.dayBlockUniform
					]}>
					<View style={stylesDesign1.lessonLine}>
						<Text
							style={[stylesDesign1.subject]}
							numberOfLines={1}
							ellipsizeMode="tail">
							Fach
						</Text>
						<Text style={[stylesDesign1.meta]} numberOfLines={1}>
							Lehrer
						</Text>
						<Text style={[stylesDesign1.meta]} numberOfLines={1}>
							Raum
						</Text>
					</View>
				</Pressable>

				<TouchableOpacity
					style={[
						styles.option,
						timetableStyle === "style2" && styles.selectedOption
					]}
					onPress={() => onChangeTimetableStyle("style2")}>
					<Text>Farbig I</Text>
				</TouchableOpacity>

				<Pressable
					key={"example2"}
					style={[
						stylesDesign2.block,
						stylesDesign2.dayBlockUniform
					]}>
					<View style={stylesDesign2.lessonLine}>
						<Text
							style={[stylesDesign2.subject]}
							numberOfLines={1}
							ellipsizeMode="tail">
							Fach
						</Text>
						<Text style={[stylesDesign2.meta]} numberOfLines={1}>
							Lehrer
						</Text>
						<Text style={[stylesDesign2.meta]} numberOfLines={1}>
							Raum
						</Text>
					</View>
				</Pressable>

				<TouchableOpacity
					style={[
						styles.option,
						timetableStyle === "style3" && styles.selectedOption
					]}
					onPress={() => onChangeTimetableStyle("style3")}>
					<Text>Farbig II</Text>
				</TouchableOpacity>

				<Pressable
					key={"example3"}
					style={[
						stylesDesign3.block,
						stylesDesign3.dayBlockUniform
					]}>
					<View style={stylesDesign3.lessonLine}>
						<Text
							style={[stylesDesign3.subject]}
							numberOfLines={1}
							ellipsizeMode="tail">
							Fach
						</Text>
						<Text style={[stylesDesign3.meta]} numberOfLines={1}>
							Lehrer
						</Text>
						<Text style={[stylesDesign3.meta]} numberOfLines={1}>
							Raum
						</Text>
					</View>
				</Pressable>

				<Text style={styles.heading}>Aktionen</Text>

				<View style={{ marginTop: 10 }}>
					<TouchableOpacity
						style={[
							sharedStyles.button,
							specialPermissionRequested && styles.disintegrate
						]}
						onPress={requestSpecialPermissions}
						disabled={specialPermissionRequested}>
						<Text>Spezialberechtigungen anfragen</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[sharedStyles.button]}
						onPress={gradeManagementHandler}>
						<Text>Notenverwaltung</Text>
					</TouchableOpacity>
				</View>

				{error && (
					<Text style={{ color: "red", marginTop: 20 }}>{error}</Text>
				)}
			</ScrollView>
		</View>
	);
};

export default Settings;

const styles = StyleSheet.create({
	option: {
		padding: 12,
		marginVertical: 6,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 6
	},
	selectedOption: {
		borderColor: "#fcba03",
		borderWidth: 2
	},
	disabledButton: {
		backgroundColor: "#dbdbdbff"
	},
	disintegrate: {
		display: "none"
	},
	lastButton: {
		marginBottom: 30
	},
	heading: {
		marginTop: 5,
		fontWeight: "bold",
		fontSize: 20,
		textAlign: "center"
	}
});

const stylesDesign1 = StyleSheet.create({
	block: {
		borderWidth: 1,
		borderColor: "#e3e3e3",
		borderRadius: 8,
		padding: 10,
		marginBottom: 5,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1
	},
	dayBlockUniform: {
		height: 58.5
	},
	lessonLine: {
		marginBottom: 6
	},
	subject: {
		fontSize: 11,
		fontWeight: "700",
		color: "#111"
	},
	meta: {
		fontSize: 10,
		color: "#444"
	}
});

const stylesDesign2 = StyleSheet.create({
	block: {
		borderWidth: 1,
		borderColor: "#334EFF", // ! color of subject
		borderRadius: 8,
		padding: 10,
		marginBottom: 5,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1
	},
	dayBlockUniform: {
		height: 58.5
	},
	lessonLine: {
		marginBottom: 6
	},
	subject: {
		fontSize: 11,
		fontWeight: "700",
		color: "#111"
	},
	meta: {
		fontSize: 10,
		color: "#444"
	}
});

const stylesDesign3 = StyleSheet.create({
	block: {
		borderWidth: 1,
		borderColor: "#334EFF", // ! color of subject
		borderRadius: 8,
		padding: 10,
		marginBottom: 5,
		backgroundColor: "#93a2ffff", // ! lighter color of subject
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1
	},
	dayBlockUniform: {
		height: 58.5
	},
	lessonLine: {
		marginBottom: 6
	},
	subject: {
		fontSize: 11,
		fontWeight: "700",
		color: "#111"
	},
	meta: {
		fontSize: 10,
		color: "#444"
	}
});
