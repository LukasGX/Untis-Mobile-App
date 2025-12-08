import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import "react-native-get-random-values";
import { sharedStyles } from "../../styles/shared";
import {
	deleteGrade,
	getGradesBySubject,
	getGradesData,
	Grade,
	GRADE_TYPES_LV,
	WEIGHTING_LV
} from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const params = useLocalSearchParams();
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [selectedSubjectReadable, setSelectedSubjectReadable] =
		useState<any>("");
	const [gradeData, setGradeData] = useState<Grade[] | null>(null);
	const [hasSpecialPermission, setHasSpecialPermission] =
		useState<boolean>(false);
	const [usesSpecialPermission, setUsesSpecialPermission] =
		useState<boolean>(false);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const permission = await SecureStore.getItemAsync(
					"specialPermissionOwning"
				);
				if (isMounted) {
					setHasSpecialPermission(permission === "true");
				}
			} catch {}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			setSelectedSubject(params?.subject?.toString());
			setSelectedSubjectReadable(params.readable);
			Update();
		}, [params])
	);

	const deleteGradeS = (id: string) => {
		Alert.alert(
			"Note löschen",
			`Möchtest du die Note ${
				usesSpecialPermission ? `(${id})` : ""
			} wirklich löschen?`,
			[
				{
					text: "Nein",
					onPress: () => DoNothing(),
					style: "cancel"
				},
				{ text: "Ja", onPress: () => sureDelete(id) }
			]
		);
	};

	const DoNothing = () => {};

	const sureDelete = async (id: string) => {
		deleteGrade(id);
		router.replace("/(tabs)/gradeManagement");
	};

	const Update = async () => {
		const gradesData = await getGradesData();
		const gradesDataBySubject = getGradesBySubject(
			gradesData,
			params.subject.toString()
		);
		setGradeData(gradesDataBySubject);
	};

	const getGradeTypeLabel = (value: string): string => {
		return (
			GRADE_TYPES_LV.find((type) => type.value === value)?.label || value
		);
	};

	const getWeightingLabel = (value: number): string => {
		return (
			WEIGHTING_LV.find((weight) => weight.value === value)?.label ||
			value.toString()
		);
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<ScrollView style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>
					Noten in {selectedSubjectReadable}
				</Text>

				{hasSpecialPermission &&
					usesSpecialPermission &&
					gradeData?.map((grade: Grade) => (
						<View key={grade.id} style={devStyles.grade}>
							<Text
								style={[
									devStyles.gradeHeading,
									grade.value <= 2 && { color: "#11a600ff" },
									grade.value > 2 &&
										grade.value <= 4 && {
											color: "#cad100ff"
										},
									grade.value > 4 && { color: "#ab0000ff" }
								]}>
								{grade.value}
							</Text>
							<Text
								style={[
									devStyles.gradeInfo,
									devStyles.gradeInfoFirst,
									{ fontStyle: "italic" }
								]}>
								{grade.id}
							</Text>
							<Text
								style={[
									devStyles.gradeInfo,
									devStyles.gradeInfoSecond
								]}>
								{new Date(grade.date).toLocaleDateString(
									"de-DE",
									{
										day: "2-digit",
										month: "2-digit",
										year: "numeric"
									}
								)}
							</Text>
							<Text
								style={[
									devStyles.gradeInfo,
									devStyles.gradeInfoThird
								]}>
								{getGradeTypeLabel(grade.type)}
							</Text>
							<Text
								style={[
									devStyles.gradeInfo,
									devStyles.gradeInfoFourth
								]}>
								{getWeightingLabel(grade.weight)} gewichtet
							</Text>
							<TouchableOpacity
								onPress={() => {
									deleteGradeS(grade.id);
								}}>
								<Ionicons
									name="trash-bin"
									style={styles.deleteIcon}
								/>
							</TouchableOpacity>
						</View>
					))}

				{(!hasSpecialPermission || !usesSpecialPermission) &&
					gradeData?.map((grade: Grade) => (
						<View key={grade.id} style={styles.grade}>
							<Text
								style={[
									styles.gradeHeading,
									grade.value <= 2 && { color: "#11a600ff" },
									grade.value > 2 &&
										grade.value <= 4 && {
											color: "#cad100ff"
										},
									grade.value > 4 && { color: "#ab0000ff" }
								]}>
								{grade.value}
							</Text>
							<Text
								style={[
									styles.gradeInfo,
									styles.gradeInfoFirst
								]}>
								{new Date(grade.date).toLocaleDateString(
									"de-DE",
									{
										day: "2-digit",
										month: "2-digit",
										year: "numeric"
									}
								)}
							</Text>
							<Text
								style={[
									styles.gradeInfo,
									styles.gradeInfoSecond
								]}>
								{getGradeTypeLabel(grade.type)}
							</Text>
							<Text
								style={[
									styles.gradeInfo,
									styles.gradeInfoThird
								]}>
								{getWeightingLabel(grade.weight)} gewichtet
							</Text>
							<TouchableOpacity
								onPress={() => {
									deleteGradeS(grade.id);
								}}>
								<Ionicons
									name="trash-bin"
									style={styles.deleteIcon}
								/>
							</TouchableOpacity>
						</View>
					))}

				{gradeData != null && gradeData.length == 0 && (
					<View>
						<Text
							style={[
								sharedStyles.errorText,
								{ marginBottom: 20 }
							]}>
							Keine Noten gefunden
						</Text>
					</View>
				)}

				<TouchableOpacity
					style={[
						sharedStyles.button,
						{ backgroundColor: "#dfdfdfff" }
					]}
					onPress={() => router.push("/(tabs)/viewGrades")}>
					<Text style={{ textAlign: "center" }}>Zurück</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[sharedStyles.button]}
					onPress={() =>
						setUsesSpecialPermission(!usesSpecialPermission)
					}>
					<Text style={{ textAlign: "center" }}>
						{usesSpecialPermission
							? "Spezialberechtigungen deaktivieren"
							: "Spezialberechtigungen aktivieren"}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
};

export default GradeManagementIndex;

const styles = StyleSheet.create({
	grade: {
		backgroundColor: "#ffffff",
		padding: 15,
		marginBottom: 10,
		borderRadius: 8,
		height: 72
	},
	gradeHeading: {
		fontWeight: "bold",
		fontSize: 52,
		position: "absolute",
		left: 15,
		top: 0
	},
	gradeInfo: {
		position: "absolute",
		left: 57
	},
	gradeInfoFirst: {
		top: 12
	},
	gradeInfoSecond: {
		top: 27
	},
	gradeInfoThird: {
		top: 42
	},
	deleteIcon: {
		position: "absolute",
		right: 10,
		top: "50%",
		fontSize: 30,
		color: "#bababaff"
	}
});

const devStyles = StyleSheet.create({
	grade: {
		backgroundColor: "#ffffff",
		padding: 15,
		marginBottom: 10,
		borderRadius: 8,
		height: 92
	},
	gradeHeading: {
		fontWeight: "bold",
		fontSize: 80,
		position: "absolute",
		left: 15,
		top: -10
	},
	gradeInfo: {
		position: "absolute",
		left: 72
	},
	gradeInfoFirst: {
		top: 15
	},
	gradeInfoSecond: {
		top: 30
	},
	gradeInfoThird: {
		top: 45
	},
	gradeInfoFourth: {
		top: 60
	}
});

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
