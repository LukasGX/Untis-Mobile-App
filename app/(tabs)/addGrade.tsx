import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { sharedStyles } from "../../styles/shared";
import {
	GRADE_TYPES_LV,
	GRADES_LV,
	SUBJECTS_WITH_KEYS_LV,
	WEIGHTING_LV
} from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedGradeType, setSelectedGradeType] = useState("");
	const [selectedWeighting, setSelectedWeighting] = useState("");
	const [selectedGrade, setSelectedGrade] = useState("");

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
