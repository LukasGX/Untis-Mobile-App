import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";
import RNPickerSelect from "react-native-picker-select";
import { sharedStyles } from "../../styles/shared";
import { SUBJECTS_WITH_KEYS_LV } from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {})();
		return () => {
			isMounted = false;
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			// reset choice
			setSelectedSubject(null);
		}, [])
	);

	const subjects = SUBJECTS_WITH_KEYS_LV;

	const getSubjectLabel = (value: string | null): string => {
		if (!value) return "";
		return (
			SUBJECTS_WITH_KEYS_LV.find((subject) => subject.value === value)
				?.label || value
		);
	};

	const viewGrades = () => {
		if (!selectedSubject) {
			Alert.alert("Kein Fach ausgewählt", "Bitte wähle ein Fach aus");
			return;
		}
		let subject: string = selectedSubject as string;
		let subjectReadable: string = getSubjectLabel(subject);
		setSelectedSubject(null);
		router.push({
			pathname: "/(tabs)/realViewGrades",
			params: {
				subject: subject,
				readable: subjectReadable
			}
		});
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Noten ansehen</Text>

				<RNPickerSelect
					onValueChange={(value) => setSelectedSubject(value)}
					key={Date.now()}
					items={subjects}
					value={selectedSubject}
					placeholder={{ label: "Fach auswählen...", value: null }}
					style={pickerSelectStyles}
				/>

				<TouchableOpacity
					style={[sharedStyles.button, { marginTop: 20 }]}
					onPress={() => viewGrades()}>
					<Text style={{ textAlign: "center" }}>Noten ansehen</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						sharedStyles.button,
						{ backgroundColor: "#dfdfdfff" }
					]}
					onPress={() => router.replace("/(tabs)/gradeManagement")}>
					<Text style={{ textAlign: "center" }}>Schließen</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default GradeManagementIndex;

const styles = StyleSheet.create({});

const pickerSelectStyles = {
	inputIOS: {
		backgroundColor: "#ffffff",
		color: "black",
		paddingRight: 30
	},
	inputAndroid: {
		backgroundColor: "#ffffff",
		color: "black",
		paddingRight: 30
	}
};
