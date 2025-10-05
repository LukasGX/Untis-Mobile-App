import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createUntis, realTimetable } from "../../method";

// TODO: Move credentials to a secure location (env variables / secure store). Hardcoding is insecure.
const credentials = {
	school: "",
	user: "",
	password: "",
	host: "",
};

// initial date (can default to today or a fixed date)
const initialDate = new Date();

const Timetable = () => {
	const [timetable, setTimetable] = useState<any | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

	const fetchData = useCallback(
		async (dateOverride?: Date) => {
			setLoading(true);
			setError(null);
			try {
				const untis = createUntis(credentials.school, credentials.user, credentials.password, credentials.host);
				await untis.login();
				const dateToUse = dateOverride || selectedDate;
				const data = await realTimetable(untis, dateToUse);
				setTimetable(data);
			} catch (e: any) {
				setError(e?.message || "Failed to load timetable");
			} finally {
				setLoading(false);
			}
		},
		[selectedDate]
	);

	useEffect(() => {
		fetchData();
	}, [fetchData, selectedDate]);

	// Helper to format HHmm numbers -> HH:MM
	const formatTime = (n: number) => {
		if (typeof n !== "number") return "--:--";
		const s = n.toString().padStart(4, "0");
		return `${s.slice(0, 2)}:${s.slice(2)}`;
	};

	// Build display blocks from timetable object
	const blocks = React.useMemo(() => {
		if (!timetable) return [] as any[];
		const blockOrder = (id: string) => {
			if (id === "M") return 6.5; // place M logically between 6 and 7
			const n = Number(id);
			return isNaN(n) ? 9999 : n; // non-numeric fallback goes to end
		};
		const entries = Object.entries(timetable).filter(([k]) => k !== "date");
		entries.sort((a, b) => blockOrder(a[0]) - blockOrder(b[0]));
		return entries.map(([id, value]) => {
			if (Array.isArray(value)) {
				return {
					id,
					free: false,
					entries: value.map((v: any) => ({
						start: v.startTime,
						end: v.endTime,
						subject: (v.lesson?.subject || []).join(", ") || "-",
						teacher: (v.lesson?.teacher || []).join(", ") || "-",
						room: (v.lesson?.room || []).join(", ") || "-",
						klass: (v.lesson?.class || []).join(", ") || "",
					})),
				};
			}
			// single object (likely free or a single slot with null lesson)
			return {
				id,
				free: value && (value as any).lesson === null,
				start: (value as any)?.startTime,
				end: (value as any)?.endTime,
			};
		});
	}, [timetable]);

	// date helpers
	const toISO = (d: Date) => d.toISOString().slice(0, 10); // yyyy-mm-dd
	const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
	const formatDisplay = (d: Date) => {
		const iso = toISO(d);
		const [y, m, day] = iso.split("-");
		return `${day}.${m}.${y}`; // dd.mm.yyyy
	};
	const isoToDisplay = (iso?: string) => {
		if (!iso) return "";
		const [y, m, d] = iso.split("-");
		return `${d}.${m}.${y}`;
	};
	const isSameDay = (a: Date, b: Date) => toISO(a) === toISO(b);

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Untis+</Text>
			<ScrollView style={styles.container} contentContainerStyle={styles.scrollInner}>
				<View style={styles.headerRow}>
					<Text style={styles.semiheading}>Mein Stundenplan</Text>
				</View>
				{/* Date selector */}
				<View style={styles.dateSelector}>
					<Pressable
						style={({ pressed }) => [styles.dateBtn, pressed && styles.dateBtnPressed]}
						onPress={() => {
							const d = addDays(selectedDate, -1);
							setSelectedDate(d);
						}}
						disabled={loading}>
						<Text style={styles.dateBtnText}>{"<"}</Text>
					</Pressable>
					<View style={styles.dateDisplayWrap}>
						<Text style={styles.dateDisplay}>{formatDisplay(selectedDate)}</Text>
						<Pressable
							style={({ pressed }) => [styles.inlineSmallBtn, pressed && styles.inlineSmallBtnPressed]}
							onPress={() => {
								const today = new Date();
								// Only change if different to avoid refetch loop
								if (!isSameDay(today, selectedDate)) setSelectedDate(today);
							}}
							disabled={loading}>
							<Text style={styles.inlineSmallBtnText}>Heute</Text>
						</Pressable>
					</View>
					<Pressable
						style={({ pressed }) => [styles.dateBtn, pressed && styles.dateBtnPressed]}
						onPress={() => {
							const d = addDays(selectedDate, 1);
							setSelectedDate(d);
						}}
						disabled={loading}>
						<Text style={styles.dateBtnText}>{">"}</Text>
					</Pressable>
				</View>
				<View style={styles.actions}>
					<Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]} onPress={() => fetchData()} disabled={loading}>
						<Text style={styles.actionBtnText}>{loading ? "Aktualisiere..." : "Neu laden"}</Text>
					</Pressable>
					<Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]} onPress={() => setTimetable(null)}>
						<Text style={styles.actionBtnText}>Leeren</Text>
					</Pressable>
				</View>

				{error && <Text style={styles.error}>{error}</Text>}
				{loading && !error && <ActivityIndicator style={{ marginVertical: 12 }} />}

				{!loading &&
					!error &&
					blocks.map((block) => (
						<View key={block.id} style={[styles.block, block.free && styles.blockFree]}>
							<Text style={styles.blockTitle}>{block.id}</Text>
							{block.free ? (
								<Text style={styles.freeText}>
									{formatTime(block.start)} - {formatTime(block.end)} Frei
								</Text>
							) : (
								block.entries?.map((entry: any, i: number) => (
									<View key={i} style={styles.lessonLine}>
										<Text style={styles.time}>
											{formatTime(entry.start)}-{formatTime(entry.end)}
										</Text>
										<Text style={styles.subject}>{entry.subject}</Text>
										<Text style={styles.meta}>{entry.teacher}</Text>
										<Text style={styles.meta}>{entry.room}</Text>
										{!!entry.klass && <Text style={styles.classText}>{entry.klass}</Text>}
									</View>
								))
							)}
						</View>
					))}
			</ScrollView>
		</View>
	);
};

export default Timetable;

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: "#fff",
	},
	container: {
		padding: 10,
	},
	scrollInner: {
		paddingBottom: 40,
		marginBottom: 40,
	},
	heading: {
		fontSize: 30,
		backgroundColor: "#fcba03",
		padding: 10,
		textAlign: "center",
	},
	semiheading: {
		fontSize: 20,
		padding: 10,
		textAlign: "center",
		marginBottom: 10,
	},
	button: {
		fontSize: 15,
		backgroundColor: "#ffcb3dff",
		padding: 10,
		borderRadius: 8,
		textAlign: "center",
		marginBottom: 10,
	},
	error: {
		color: "#b00020",
		marginTop: 8,
		textAlign: "center",
	},
	mono: {
		fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "System" }),
		fontSize: 12,
		lineHeight: 16,
		color: "#222",
		paddingHorizontal: 8,
	},
	headerRow: {
		marginBottom: 8,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
		flexWrap: "wrap",
	},
	actionBtn: {
		backgroundColor: "#fcba03",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 6,
		width: "48%",
	},
	actionBtnPressed: {
		opacity: 0.65,
	},
	actionBtnText: {
		fontWeight: "600",
		color: "#222",
	},
	block: {
		borderWidth: 1,
		borderColor: "#e3e3e3",
		borderRadius: 8,
		padding: 10,
		marginBottom: 12,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
	},
	blockFree: {
		backgroundColor: "#f6f6f6",
		borderStyle: "dashed",
	},
	blockTitle: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 6,
	},
	freeText: {
		fontStyle: "italic",
		color: "#666",
	},
	lessonLine: {
		marginBottom: 6,
	},
	time: {
		fontWeight: "600",
		color: "#333",
	},
	subject: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111",
	},
	meta: {
		fontSize: 12,
		color: "#444",
	},
	classText: {
		fontSize: 12,
		color: "#222",
		opacity: 0.75,
	},
	dateSelector: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		marginBottom: 18,
	},
	dateBtn: {
		backgroundColor: "#fcba03",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 44,
		alignItems: "center",
	},
	dateBtnPressed: { opacity: 0.6 },
	dateBtnText: { fontWeight: "700", fontSize: 16, color: "#222" },
	dateDisplayWrap: { alignItems: "center" },
	dateDisplay: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
	inlineSmallBtn: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
		backgroundColor: "#eee",
	},
	inlineSmallBtnPressed: { opacity: 0.6 },
	inlineSmallBtnText: { fontSize: 12, fontWeight: "600" },
});
