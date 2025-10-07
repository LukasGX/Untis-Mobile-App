import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createUntis, realTimetable } from "../../method";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

// Credentials now sourced from secure storage

// initial date (can default to today or a fixed date)
const initialDate = new Date();

const Timetable = () => {
	const [timetable, setTimetable] = useState<any | null>(null);
	const [timetableWeek, setTimetableWeek] = useState<Record<string, any> | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
	const [viewMode, setViewMode] = useState<"day" | "week">("day");

	const fetchData = useCallback(
		async (dateOverride?: Date) => {
			setLoading(true);
			setError(null);
			try {
				const stored = await loadCredentials();
				if (!stored) {
					setError("Nicht eingeloggt");
					setTimetable(null);
					setTimetableWeek(null);
					return;
				}
				const untis = createUntis(stored.school, stored.user, stored.password, stored.host);
				await untis.login();
				const dateToUse = dateOverride || selectedDate;
				if (viewMode === "day") {
					const data = await realTimetable(untis, dateToUse);
					setTimetable(data);
					setTimetableWeek(null);
				} else {
					// week mode: fetch Monday-Friday for the week containing selectedDate
					const weekDays = getWeekDays(dateToUse);
					const results = await Promise.all(
						weekDays.map(async (d) => {
							return { iso: isoKey(d), data: await realTimetable(untis, d) };
						})
					);
					const map: Record<string, any> = {};
					results.forEach((r) => (map[r.iso] = r.data));
					setTimetableWeek(map);
					setTimetable(null);
				}
			} catch (e: any) {
				setError(e?.message || "Failed to load timetable");
			} finally {
				setLoading(false);
			}
		},
		[selectedDate, viewMode]
	);

	useEffect(() => {
		fetchData();
	}, [fetchData, selectedDate, viewMode]);

	// Helper to format HHmm numbers -> HH:MM
	const formatTime = (n: number) => {
		if (typeof n !== "number") return "--:--";
		const s = n.toString().padStart(4, "0");
		return `${s.slice(0, 2)}:${s.slice(2)}`;
	};

	// Helpers to build block arrays
	const buildBlocks = (dayData: any) => {
		if (!dayData) return [] as any[];
		const blockOrder = (id: string) => {
			if (id === "M") return 6.5;
			const n = Number(id);
			return isNaN(n) ? 9999 : n;
		};
		const entries = Object.entries(dayData).filter(([k]) => k !== "date");
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
			return {
				id,
				free: value && (value as any).lesson === null,
				start: (value as any)?.startTime,
				end: (value as any)?.endTime,
			};
		});
	};

	const blocks = React.useMemo(() => buildBlocks(timetable), [timetable]);

	// week related helpers
	const isoKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	const getWeekDays = (d: Date) => {
		const day = d.getDay(); // 0 Sun .. 6 Sat
		const diffToMonday = (day + 6) % 7; // Monday ->0, Sunday ->6
		const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMonday);
		return [0, 1, 2, 3, 4].map((i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
	};
	const weekDays = React.useMemo(() => (viewMode === "week" ? getWeekDays(selectedDate) : []), [viewMode, selectedDate]);
	const formatWeekHeader = (days: Date[]) => {
		if (!days.length) return "";
		const first = days[0];
		const last = days[days.length - 1];
		const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
		return `${fmt(first)} - ${fmt(last)}`;
	};

	// date helpers (local timezone safe)
	const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
	const formatDisplay = (d: Date) => {
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		return `${day}.${month}.${year}`; // dd.mm.yyyy
	};
	const formatDisplayShort = (d: Date) => {
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		return `${day}.${month}`; // dd.mm
	};
	const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

	return (
		<View style={[sharedStyles.screen, styles.wrapper]}>
			{/* Top bar spanning full width */}
			<View style={styles.topBar}>
				<Pressable accessibilityLabel="Neu laden" style={({ pressed }) => [styles.barBtn, pressed && styles.barBtnPressed]} onPress={() => fetchData()} disabled={loading}>
					<Ionicons name="reload-outline" style={styles.barIcon} />
				</Pressable>
				<Text style={styles.barTitle}>Untis+</Text>
				<Pressable accessibilityLabel="Ansicht umschalten" style={({ pressed }) => [styles.barBtn, pressed && styles.barBtnPressed]} onPress={() => setViewMode((m) => (m === "day" ? "week" : "day"))} disabled={loading}>
					<Text style={styles.barSwitchText}>{viewMode === "day" ? "Woche" : "Tag"}</Text>
				</Pressable>
			</View>
			<ScrollView style={styles.container} contentContainerStyle={styles.scrollInner}>
				{/* <View style={styles.headerRow}>
					<Text style={sharedStyles.semiHeading}>Mein Stundenplan</Text>
				</View> */}
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
						{viewMode === "day" ? (
							<Text style={styles.dateDisplay}>{formatDisplay(selectedDate)}</Text>
						) : (
							<View style={{ alignItems: "center" }}>
								<Text style={styles.dateDisplay}>Woche</Text>
								<Text style={styles.dateDisplayRange}>{formatWeekHeader(weekDays)}</Text>
							</View>
						)}
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
				{error && <Text style={styles.error}>{error}</Text>}
				{loading && !error && <ActivityIndicator style={{ marginVertical: 12 }} />}

				{!loading &&
					!error &&
					viewMode === "day" &&
					blocks.map((block) => {
						const entries = block.entries || [];
						const first = entries[0];
						const extra = entries.length - 1;
						return (
							<View key={block.id} style={[styles.block, block.free && styles.blockFree]}>
								<View style={styles.blockHeaderRow}>
									<Text style={styles.blockTitle}>{block.id}</Text>
									{!block.free && extra > 0 && <Text style={styles.moreIndicator}>+{extra}</Text>}
								</View>
								{block.free ? (
									<Text style={styles.freeText} numberOfLines={2}>
										{formatTime(block.start)} - {formatTime(block.end)} Frei
									</Text>
								) : first ? (
									<View style={styles.lessonLine}>
										<Text style={styles.time} numberOfLines={1}>
											{formatTime(first.start)}-{formatTime(first.end)}
										</Text>
										<Text style={styles.subject} numberOfLines={1} ellipsizeMode="tail">
											{first.subject}
										</Text>
										<Text style={styles.meta} numberOfLines={1}>
											{first.teacher}
										</Text>
										<Text style={styles.meta} numberOfLines={1}>
											{first.room}
										</Text>
										{!!first.klass && (
											<Text style={styles.classText} numberOfLines={1}>
												{first.klass}
											</Text>
										)}
									</View>
								) : null}
							</View>
						);
					})}

				{!loading && !error && viewMode === "week" && (
					<View style={styles.weekView}>
						{weekDays.map((d) => {
							const iso = isoKey(d);
							const dayData = timetableWeek?.[iso];
							const dayBlocks = buildBlocks(dayData);
							return (
								<View key={iso} style={styles.weekDaySection}>
									<Text style={styles.weekDayHeader}>{d.toLocaleDateString("de-DE", { weekday: "short" })}</Text>
									<Text style={styles.weekDayHeaderMini}>{formatDisplayShort(d)}</Text>
									{dayBlocks.length === 0 && <Text style={styles.freeText}>Keine Daten</Text>}
									{dayBlocks.map((block) => {
										const entries = block.entries || [];
										const first = entries[0];
										const extra = entries.length - 1;
										// build time range for header (weekly view only)
										let timeRange = "";
										if (block.free && block.start && block.end) {
											timeRange = `${formatTime(block.start)}-${formatTime(block.end)}`;
										} else if (!block.free && first) {
											timeRange = `${formatTime(first.start)}-${formatTime(first.end)}`;
										}
										return (
											<View key={block.id} style={[styles.block, styles.blockUniform, styles.blockMin, block.free && styles.blockFree]}>
												<Text style={styles.blockTitle}>{timeRange ? `${timeRange}` : ""}</Text>
												{!block.free && extra > 0 && <Text style={styles.moreIndicator}>+{extra}</Text>}

												{block.free ? (
													<Text style={styles.freeText} numberOfLines={2}>
														Frei
													</Text>
												) : first ? (
													<View style={styles.lessonLine}>
														<Text style={styles.subject} numberOfLines={1}>
															{first.subject}
														</Text>
														<Text style={styles.meta} numberOfLines={1}>
															{first.teacher}
														</Text>
														<Text style={styles.meta} numberOfLines={1}>
															{first.room}
														</Text>
													</View>
												) : null}
											</View>
										);
									})}
								</View>
							);
						})}
					</View>
				)}
			</ScrollView>
		</View>
	);
};

export default Timetable;

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		paddingTop: 70,
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
		padding: 20,
		flex: 1,
		alignItems: "center",
		justifyContent: "space-between",
	},
	semiheading: {
		fontSize: 20,
		padding: 10,
		textAlign: "center",
		marginBottom: 0,
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
		marginBottom: 0,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 10,
		flexWrap: "wrap",
	},
	actionBtn: {
		backgroundColor: "#ffcb3dff",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 6,
	},
	actionBtnPressed: {
		opacity: 0.65,
	},
	actionBtnText: {
		fontWeight: "600",
		color: "#222",
	},
	actionBtnIcon: {
		fontSize: 18,
		color: "#222",
	},
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
		elevation: 1,
	},
	blockUniform: {
		height: 75,
		justifyContent: "space-between",
	},
	blockMin: {
		width: 75,
	},
	blockFree: {
		backgroundColor: "#f6f6f6",
		borderStyle: "dashed",
	},
	blockHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	blockTitle: {
		fontSize: 8,
		fontWeight: "700",
		marginBottom: 1,
	},
	moreIndicator: {
		fontSize: 8,
		fontWeight: "600",
		color: "#555",
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
		fontSize: 12,
		fontWeight: "600",
		color: "#111",
	},
	meta: {
		fontSize: 10,
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
		gap: 30,
		marginBottom: 10,
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
	dateDisplayRange: { fontSize: 12, fontWeight: "500", opacity: 0.8 },
	inlineSmallBtn: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
		backgroundColor: "#ffe18fff",
	},
	inlineSmallBtnPressed: { opacity: 0.6 },
	inlineSmallBtnText: { fontSize: 12, fontWeight: "600" },
	weekDaySection: { marginBottom: 24 },
	weekDayHeader: { fontSize: 18, fontWeight: "700" },
	weekDayHeaderMini: { fontSize: 12, marginBottom: 8 },
	weekView: {
		flex: 1,
		flexDirection: "row",
		gap: 5,
	},
	topBar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#fcba03",
		paddingHorizontal: 12,
		padding: 20,
		elevation: 3,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		zIndex: 20,
	},
	barBtn: {
		backgroundColor: "#ffdc6a",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		minWidth: 60,
		alignItems: "center",
	},
	barBtnPressed: { opacity: 0.65 },
	barIcon: { fontSize: 20, color: "#222", fontWeight: "600" },
	barTitle: { fontSize: 30 },
	barSwitchText: { fontSize: 14, fontWeight: "600", color: "#222" },
});
