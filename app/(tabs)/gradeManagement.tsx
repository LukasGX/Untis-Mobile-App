import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import {
	calculateWeightedAverage,
	getGradesData,
	getGradeStat,
	GradesData,
	loadCredentials
} from "../../utils/secureCredentials";

const GradeManagementIndex = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const [gradeData, setGradeData] = useState<GradesData | null>(null);
	const [gradeAverage, setGradeAverage] = useState<number>(0);

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

			Update();
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			Update();
		}, [])
	);

	const Update = async () => {
		const gradesData = await getGradesData();
		setGradeData(gradesData);

		setGradeAverage(calculateWeightedAverage(gradesData));
	};

	const absg = (grade: number) => {
		if (gradeData != null)
			return getGradeStat(gradeData, grade, "absolute");
		else return 0;
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Notenverwaltung</Text>

				<View style={styles.container}>
					{(gradeData == null || gradeData.grades.length == 0) && (
						<Text style={sharedStyles.errorTextNoMargin}>
							Keine Daten
						</Text>
					)}
					{gradeData != null && gradeData.grades.length > 0 && (
						<View>
							<Text
								style={[styles.miniStat, { marginBottom: 8 }]}>
								Durchschnitt: {gradeAverage.toFixed(2)}
							</Text>
							<View
								style={{
									display: "flex",
									flexDirection: "row",
									gap: 6,
									flexWrap: "wrap",
									marginVertical: 4
								}}>
								{absg(1) > 0 && (
									<Text style={styles.miniStat}>
										{absg(1)}x Sehr gut
									</Text>
								)}
								{absg(2) > 0 && (
									<Text style={styles.miniStat}>
										{absg(2)}x Gut
									</Text>
								)}
								{absg(3) > 0 && (
									<Text style={styles.miniStat}>
										{absg(3)}x Befriedigend
									</Text>
								)}
								{absg(4) > 0 && (
									<Text style={styles.miniStat}>
										{absg(4)}x Ausreichend
									</Text>
								)}
								{absg(5) > 0 && (
									<Text style={styles.miniStat}>
										{absg(5)}x Mangelhaft
									</Text>
								)}
								{absg(6) > 0 && (
									<Text style={styles.miniStat}>
										{absg(6)}x Ungenügend
									</Text>
								)}
							</View>
						</View>
					)}
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
	},
	miniStat: {
		backgroundColor: "#e2e2e2ff",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
		width: "auto",
		alignSelf: "flex-start"
	}
});
