import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";
import RNPickerSelect from "react-native-picker-select";
import { sharedStyles } from "../../styles/shared";
import {
	addGrade,
	GRADE_TYPES_LV,
	GRADES_LV,
	SUBJECTS_WITH_KEYS_LV,
	WEIGHTING_LV
} from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedGradeType, setSelectedGradeType] = useState("");
	const [selectedWeighting, setSelectedWeighting] = useState<number>(0);
	const [selectedGrade, setSelectedGrade] = useState<number>(0);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {})();
		return () => {
			isMounted = false;
		};
	}, []);

	const subjects = SUBJECTS_WITH_KEYS_LV;
	const gradeTypes = GRADE_TYPES_LV;
	const weighting = WEIGHTING_LV;
	const grades = GRADES_LV;

	const saveGrade = () => {
		const date = new Date();
		const formattedDate = date.toISOString();
		addGrade({
			subject: selectedSubject,
			type: selectedGradeType,
			value: selectedGrade,
			weight: selectedWeighting,
			date: formattedDate
		});
		router.replace("/(tabs)/gradeManagement");
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Note eintragen</Text>

				<RNPickerSelect
					onValueChange={(value) => setSelectedSubject(value)}
					items={subjects}
					value={selectedSubject}
					placeholder={{ label: "Fach auswählen...", value: null }}
					style={pickerSelectStyles}
				/>

				<RNPickerSelect
					onValueChange={(value) => setSelectedGradeType(value)}
					items={gradeTypes}
					value={selectedGradeType}
					placeholder={{
						label: "Art der Note auswählen...",
						value: null
					}}
					style={pickerSelectStyles}
				/>

				<RNPickerSelect
					onValueChange={(value) => setSelectedWeighting(value)}
					items={weighting}
					value={selectedWeighting}
					placeholder={{
						label: "Gewichtung der Note auswählen...",
						value: null
					}}
					style={pickerSelectStyles}
				/>

				<RNPickerSelect
					onValueChange={(value) => setSelectedGrade(value)}
					items={grades}
					value={selectedGrade}
					placeholder={{
						label: "Note auswählen...",
						value: null
					}}
					style={pickerSelectStyles}
				/>

				<TouchableOpacity
					style={[sharedStyles.button, { marginTop: 20 }]}
					onPress={() => saveGrade()}>
					<Text style={{ textAlign: "center" }}>Note eintragen</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						sharedStyles.button,
						{ backgroundColor: "#dfdfdfff" }
					]}
					onPress={() => router.replace("/(tabs)/gradeManagement")}>
					<Text style={{ textAlign: "center" }}>Abbrechen</Text>
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
