import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

const HomeworkView = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [untis, setUntis] = useState<any>();

	const [homeworkData, setHomeworkData] = useState<any>();

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

				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);

				const in2weeks = new Date();
				in2weeks.setDate(in2weeks.getDate() + 14);

				const hw = await untis.getHomeWorksFor(yesterday, in2weeks);

				setHomeworkData(hw);
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
				<Text style={sharedStyles.semiHeading}>Hausaufgaben</Text>
				{homeworkData?.homeworks?.map((hw: any, index: any) => (
					<View
						key={hw.id || index}
						style={{
							marginBottom: 16,
							padding: 12,
							backgroundColor: "#f9f9f9",
							borderRadius: 8
						}}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 16,
								marginBottom: 4
							}}>
							{homeworkData?.lessons?.find(
								(l: any) => l.id === hw.lessonId
							)?.subject || "Unbekannt"}
						</Text>
						<Text
							style={{
								color: "#666",
								fontSize: 14,
								marginBottom: 8
							}}>
							{new Date(
								hw.date.toString().slice(0, 4) +
									"-" +
									hw.date.toString().slice(4, 6) +
									"-" +
									hw.date.toString().slice(6, 8)
							).toLocaleDateString("de-DE", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric"
							})}{" "}
							-{" "}
							{new Date(
								hw.dueDate.toString().slice(0, 4) +
									"-" +
									hw.dueDate.toString().slice(4, 6) +
									"-" +
									hw.dueDate.toString().slice(6, 8)
							).toLocaleDateString("de-DE", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric"
							})}{" "}
							• {hw.completed ? "Fertig" : "Ausstehend"}
						</Text>
						<Text style={{ lineHeight: 20 }}>{hw.text}</Text>
					</View>
				))}
			</View>
		</View>
	);
};

export default HomeworkView;

const styles = StyleSheet.create({});
