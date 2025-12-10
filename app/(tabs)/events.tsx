import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

const Events = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [untis, setUntis] = useState<any>();

	const [homeworkData, setHomeworkData] = useState<any>();
	const [examData, setExamData] = useState<any>();

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

				// homework
				const hw = await untis.getHomeWorksFor(yesterday, in2weeks);
				setHomeworkData(hw);

				// exams
				const exams = await untis.getExamsForRange(yesterday, in2weeks);
				console.log(exams);
				setExamData(exams);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	const UtD = (untisDate: string): Date => {
		return new Date(
			untisDate.toString().slice(0, 4) +
				"-" +
				untisDate.toString().slice(4, 6) +
				"-" +
				untisDate.toString().slice(6, 8)
		);
	};

	const UtDs = (untisDate: string): string => {
		return UtD(untisDate).toLocaleDateString("de-DE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric"
		});
	};

	const isWithin8DaysExclusive = (date: Date): boolean => {
		const diffMs = date.getTime() - Date.now();
		return diffMs > 0 && diffMs < 7 * 24 * 60 * 60 * 1000;
	};

	const daysUntil = (target: Date): number => {
		const today = new Date();
		const utcToday = Date.UTC(
			today.getFullYear(),
			today.getMonth(),
			today.getDate()
		);
		const utcTarget = Date.UTC(
			target.getFullYear(),
			target.getMonth(),
			target.getDate()
		);
		const msPerDay = 1000 * 60 * 60 * 24;
		return Math.round((utcTarget - utcToday) / msPerDay);
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Prüfungen</Text>
				{examData?.map((exam: any, index: any) => {
					const date = UtD(exam.examDate);
					const dateString = UtDs(exam.examDate);
					return (
						<View
							key={exam.id || index}
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
								{exam.examType} - {exam.subject}
							</Text>
							<Text
								style={{
									color: "#666",
									fontSize: 14,
									marginBottom: 8
								}}>
								<Text
									style={
										isWithin8DaysExclusive(date) &&
										styles.In1Week
									}>
									{dateString} (in {daysUntil(date)}{" "}
									{daysUntil(date) == 1 ? "Tag" : "Tagen"})
								</Text>{" "}
								• {exam.teachers.join(", ")} •{" "}
								{exam.rooms.join(", ")}
							</Text>
						</View>
					);
				})}

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
							{UtDs(hw.date)} - {UtDs(hw.dueDate)} •{" "}
							{hw.completed ? "Fertig" : "Ausstehend"}
						</Text>
						<Text style={{ lineHeight: 20 }}>{hw.text}</Text>
					</View>
				))}
			</View>
		</View>
	);
};

export default Events;

const styles = StyleSheet.create({
	In1Week: {
		color: "#ff0000ff"
	}
});
