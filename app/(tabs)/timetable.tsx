import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View
} from "react-native";
import { createUntis, realTimetable } from "../../method";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

const TIMETABLE_STYLE_KEY = "timetableStyle";
const SPECIAL_PERMISSION_REQUESTED_KEY = "specialPermissionRequested";

// initial date (can default to today or a fixed date)
const initialDate = new Date();

const Timetable = () => {
	const [timetable, setTimetable] = useState<any | null>(null);
	const [timetableWeek, setTimetableWeek] = useState<Record<
		string,
		any
	> | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
	const [viewMode, setViewMode] = useState<"day" | "week">("day");
	const [showDateModal, setShowDateModal] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState<string | null>(null);

	const [timetableStyle, setTimetableStyle] = useState<
		"style1" | "style2" | "style3"
	>("style1");
	const [specialPermissionRequested, setSpecialPermissionRequested] =
		useState<boolean>(false);

	const fetchData = useCallback(
		async (dateOverride?: Date) => {
			let isMounted = true;
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
				const untis = createUntis(
					stored.school,
					stored.user,
					stored.password,
					stored.host
				);
				await untis.login();
				const dateToUse = dateOverride || selectedDate;
				if (viewMode === "day") {
					const data = await realTimetable(untis, dateToUse, false);
					setTimetable(data);
					setTimetableWeek(null);
				} else {
					const weekDays = getWeekDays(dateToUse);
					const results = await Promise.all(
						weekDays.map(async (d) => {
							return {
								iso: isoKey(d),
								data: await realTimetable(untis, d, true)
							};
						})
					);
					const map: Record<string, any> = {};
					results.forEach((r) => (map[r.iso] = r.data));
					setTimetableWeek(map);
					setTimetable(null);
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
						klassList: v.lesson?.class || [],
						code: v.lesson?.code || "",
						teacherOld:
							(v.lesson?.teacherOld || []).join(", ") || "",
						roomOld: (v.lesson?.roomOld || []).join(", ") || "",
						subjectOld:
							(v.lesson?.subjectOld || []).join(", ") || ""
					}))
				};
			}
			return {
				id,
				free: value && (value as any).lesson === null,
				start: (value as any)?.startTime,
				end: (value as any)?.endTime,
				code: ""
			};
		});
	};

	const blocks = React.useMemo(() => buildBlocks(timetable), [timetable]);

	// Daily index/time data (for left column in day view)
	const dayIndexData = React.useMemo(() => {
		if (viewMode !== "day" || !blocks)
			return [] as { id: string; timeRange: string }[];
		return blocks.map((b: any) => {
			let timeRange = "";
			if (b.free && b.start && b.end) {
				timeRange = `${formatTime(b.start)}-${formatTime(b.end)}`;
			} else if (!b.free && b.entries && b.entries[0]) {
				const first = b.entries[0];
				timeRange = `${formatTime(first.start)}-${formatTime(
					first.end
				)}`;
			}
			return { id: b.id, timeRange };
		});
	}, [viewMode, blocks]);

	// week related helpers
	const isoKey = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(d.getDate()).padStart(2, "0")}`;
	const getWeekDays = (d: Date) => {
		const day = d.getDay(); // 0 Sun .. 6 Sat
		const diffToMonday = (day + 6) % 7; // Monday ->0, Sunday ->6
		const monday = new Date(
			d.getFullYear(),
			d.getMonth(),
			d.getDate() - diffToMonday
		);
		return [0, 1, 2, 3, 4].map(
			(i) =>
				new Date(
					monday.getFullYear(),
					monday.getMonth(),
					monday.getDate() + i
				)
		);
	};
	const weekDays = React.useMemo(
		() => (viewMode === "week" ? getWeekDays(selectedDate) : []),
		[viewMode, selectedDate]
	);
	// Weekly structure (index/time column + per-day aligned blocks)
	const weekStructure = React.useMemo(() => {
		if (viewMode !== "week" || !timetableWeek) return null;
		const blockOrder = (id: string) => {
			if (id === "M") return 6.5;
			const n = Number(id);
			return isNaN(n) ? 9999 : n;
		};
		const perDay = weekDays.map((d) => {
			const iso = isoKey(d);
			const blocks = buildBlocks(timetableWeek[iso]);
			return { iso, date: d, blocks };
		});
		const idSet = new Set<string>();
		perDay.forEach((day) => day.blocks.forEach((b) => idSet.add(b.id)));
		const orderedIds = Array.from(idSet).sort(
			(a, b) => blockOrder(a) - blockOrder(b)
		);
		const indexData = orderedIds.map((id) => {
			let timeRange = "";
			for (const day of perDay) {
				const blk = day.blocks.find((b) => b.id === id);
				if (blk) {
					if (blk.free && blk.start && blk.end) {
						timeRange = `${formatTime(blk.start)}-${formatTime(
							blk.end
						)}`;
						break;
					} else if (!blk.free && blk.entries && blk.entries[0]) {
						const first = blk.entries[0];
						timeRange = `${formatTime(first.start)}-${formatTime(
							first.end
						)}`;
						break;
					}
				}
			}
			return { id, timeRange };
		});
		return { perDay, indexData };
	}, [viewMode, timetableWeek, weekDays]);
	const formatWeekHeader = (days: Date[]) => {
		if (!days.length) return "";
		const first = days[0];
		const last = days[days.length - 1];
		const fmt = (d: Date) =>
			`${String(d.getDate()).padStart(2, "0")}.${String(
				d.getMonth() + 1
			).padStart(2, "0")}.${d.getFullYear()}`;
		return `${fmt(first)} - ${fmt(last)}`;
	};

	// date helpers (local timezone safe)
	const addDays = (d: Date, days: number) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
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
	const isSameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();

	// Fetch fresh data for a single block when opening details
	const openLesson = useCallback(
		async (blockId: string, date: Date) => {
			setSelectedLesson({ id: blockId, entries: [] });
			setDetailLoading(true);
			setDetailError(null);
			try {
				const stored = await loadCredentials();
				if (!stored) {
					setDetailError("Nicht eingeloggt");
					setDetailLoading(false);
					return;
				}
				const untis = createUntis(
					stored.school,
					stored.user,
					stored.password,
					stored.host
				);
				await untis.login();
				const freshDay = await realTimetable(untis, date, false);
				const freshBlocks = buildBlocks(freshDay);
				const target = freshBlocks.find((b: any) => b.id === blockId);
				if (!target) {
					setDetailError("Block nicht gefunden");
				} else if (target.free) {
					setSelectedLesson({ id: blockId, entries: [], free: true });
				} else {
					setSelectedLesson({
						id: blockId,
						entries: target.entries || []
					});
				}
			} catch (e: any) {
				setDetailError(e?.message || "Fehler beim Laden");
			} finally {
				setDetailLoading(false);
			}
		},
		[buildBlocks]
	);

	return (
		<View style={[sharedStyles.screen, styles.wrapper]}>
			{/* Top bar spanning full width */}
			<View style={styles.topBar}>
				<View style={styles.leftBarGroup}>
					<Pressable
						accessibilityLabel="Neu laden"
						style={({ pressed }) => [
							styles.barBtn,
							pressed && styles.barBtnPressed
						]}
						onPress={() => fetchData()}
						disabled={loading}>
						<Ionicons
							name="reload-outline"
							style={styles.barIcon}
						/>
					</Pressable>
					<Pressable
						accessibilityLabel="Datum auswählen"
						style={({ pressed }) => [
							styles.barBtn,
							pressed && styles.barBtnPressed
						]}
						onPress={() => setShowDateModal(true)}
						disabled={loading}>
						<Ionicons
							name="calendar-outline"
							style={styles.barIcon}
						/>
					</Pressable>
				</View>
				<Text style={styles.barTitle}>Untis+</Text>
				<Pressable
					accessibilityLabel="Ansicht umschalten"
					style={({ pressed }) => [
						styles.barBtn,
						pressed && styles.barBtnPressed
					]}
					onPress={() =>
						setViewMode((m) => (m === "day" ? "week" : "day"))
					}
					disabled={loading}>
					<Text style={styles.barSwitchText}>
						{viewMode === "day" ? "Woche" : "Tag"}
					</Text>
				</Pressable>
			</View>

			{/* Date Selector Modal */}
			<Modal
				visible={showDateModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDateModal(false)}>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Datum wählen</Text>
						<View
							style={[styles.dateSelector, { marginBottom: 0 }]}>
							<Pressable
								style={({ pressed }) => [
									styles.dateBtn,
									pressed && styles.dateBtnPressed
								]}
								onPress={() => {
									const d = addDays(selectedDate, -1);
									setSelectedDate(d);
								}}
								disabled={loading}>
								<Text style={styles.dateBtnText}>{"<"}</Text>
							</Pressable>
							<View style={styles.dateDisplayWrap}>
								{viewMode === "day" ? (
									<Text style={styles.dateDisplay}>
										{formatDisplay(selectedDate)}
									</Text>
								) : (
									<View style={{ alignItems: "center" }}>
										<Text style={styles.dateDisplay}>
											Woche
										</Text>
										<Text style={styles.dateDisplayRange}>
											{formatWeekHeader(weekDays)}
										</Text>
									</View>
								)}
								<Pressable
									style={({ pressed }) => [
										styles.inlineSmallBtn,
										pressed && styles.inlineSmallBtnPressed
									]}
									onPress={() => {
										const today = new Date();
										if (!isSameDay(today, selectedDate))
											setSelectedDate(today);
									}}
									disabled={loading}>
									<Text style={styles.inlineSmallBtnText}>
										Heute
									</Text>
								</Pressable>
							</View>
							<Pressable
								style={({ pressed }) => [
									styles.dateBtn,
									pressed && styles.dateBtnPressed
								]}
								onPress={() => {
									const d = addDays(selectedDate, 1);
									setSelectedDate(d);
								}}
								disabled={loading}>
								<Text style={styles.dateBtnText}>{">"}</Text>
							</Pressable>
						</View>
						<View style={styles.modalActions}>
							<Pressable
								style={({ pressed }) => [
									styles.modalBtn,
									pressed && styles.modalBtnPressed
								]}
								onPress={() => setShowDateModal(false)}>
								<Text style={styles.modalBtnText}>
									Schließen
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
			{/* Lesson Detail Modal (fresh fetch) */}
			<Modal
				visible={!!selectedLesson}
				transparent
				animationType="fade"
				onRequestClose={() => setSelectedLesson(null)}>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>
							Details - {selectedLesson?.id}. Stunde
						</Text>
						{detailLoading && (
							<ActivityIndicator style={{ marginVertical: 8 }} />
						)}
						{detailError && !detailLoading && (
							<Text
								style={[
									styles.detailMeta,
									{ color: "#b00020" }
								]}>
								{detailError}
							</Text>
						)}
						{!detailLoading && !detailError && (
							<ScrollView
								style={{ maxHeight: 300 }}
								contentContainerStyle={{ gap: 8 }}>
								{selectedLesson?.free && (
									<Text style={styles.detailMeta}>Frei</Text>
								)}
								{selectedLesson?.entries?.map(
									(e: any, idx: number) => (
										<View
											key={idx}
											style={styles.detailEntry}>
											{/* Badges for cancellation or changes */}
											{e.code === "cancelled" ? (
												<Text
													style={[
														styles.cancelledBadge,
														styles.detailBadge
													]}>
													ENTFÄLLT
												</Text>
											) : e.roomOld ||
											  e.subjectOld ||
											  e.teacherOld ? (
												<Text
													style={[
														styles.changeBadge,
														styles.detailBadge
													]}>
													ÄNDERUNG
												</Text>
											) : null}
											<Text style={styles.detailTime}>
												{formatTime(e.start)} -{" "}
												{formatTime(e.end)}
											</Text>
											<Text style={styles.detailSubject}>
												{e.subjectOld &&
												e.subjectOld !== e.subject ? (
													<Text>
														<Text
															style={[
																styles.detailSubject,
																styles.subjectOld
															]}>
															{e.subjectOld}
														</Text>
														<Text>
															{" "}
															{e.subject}
														</Text>
													</Text>
												) : (
													e.subject
												)}
											</Text>
											<View style={styles.detailMetaRow}>
												<Text style={styles.detailMeta}>
													Lehrer:{" "}
													{e.teacherOld &&
													e.teacherOld !==
														e.teacher ? (
														<Text>
															<Text
																style={
																	styles.metaOld
																}>
																{e.teacherOld}
															</Text>
															<Text>
																{" "}
																{e.teacher}
															</Text>
														</Text>
													) : (
														e.teacher
													)}
												</Text>
											</View>
											<View style={styles.detailMetaRow}>
												<Text style={styles.detailMeta}>
													Raum:{" "}
													{e.roomOld &&
													e.roomOld !== e.room ? (
														<Text>
															<Text
																style={
																	styles.metaOld
																}>
																{e.roomOld}
															</Text>
															<Text>
																{" "}
																{e.room}
															</Text>
														</Text>
													) : (
														e.room
													)}
												</Text>
											</View>
											{!!e.klass && (
												<View
													style={
														styles.detailMetaRow
													}>
													<Text
														style={
															styles.detailMeta
														}>
														{(e.klassList?.length ||
															0) > 1
															? "Klassen:"
															: "Klasse:"}{" "}
														{e.klass}
													</Text>
												</View>
											)}
										</View>
									)
								)}
								{!selectedLesson?.entries?.length &&
									!selectedLesson?.free && (
										<Text style={styles.detailMeta}>
											Keine Daten
										</Text>
									)}
							</ScrollView>
						)}
						<View style={styles.modalActions}>
							<Pressable
								style={({ pressed }) => [
									styles.modalBtn,
									pressed && styles.modalBtnPressed
								]}
								onPress={() => setSelectedLesson(null)}>
								<Text style={styles.modalBtnText}>
									Schließen
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollInner}>
				{/* <View style={styles.headerRow}>
					<Text style={sharedStyles.semiHeading}>Mein Stundenplan</Text>
				</View> */}
				{/* Date selector moved to modal */}
				{error && <Text style={styles.error}>{error}</Text>}
				{loading && !error && (
					<ActivityIndicator style={{ marginVertical: 12 }} />
				)}

				{!loading && !error && viewMode === "day" && (
					<View style={styles.dayView}>
						{/* Index/Time Column (Day) */}
						<View
							style={[
								styles.weekDaySection,
								styles.weekIndexCol,
								styles.dayIndexCol
							]}>
							{dayIndexData.map((idx) => (
								<View
									key={idx.id}
									style={[
										styles.block,
										styles.dayBlockUniform,
										styles.indexBlock
									]}>
									<Text style={styles.indexBlockTitle}>
										{idx.id}
									</Text>
									{idx.timeRange ? (
										(() => {
											const parts =
												idx.timeRange.split("-");
											const start = parts[0] || "";
											const end = parts[1] || "";
											return (
												<View
													style={{
														alignItems: "center"
													}}>
													<Text
														style={
															styles.indexBlockTime
														}>
														{start}
													</Text>
													<Text
														style={
															styles.indexBlockTime
														}>
														{end}
													</Text>
												</View>
											);
										})()
									) : (
										<Text style={styles.indexBlockTime}>
											{" "}
										</Text>
									)}
								</View>
							))}
						</View>
						{/* Day Blocks */}
						<View style={{ flex: 1 }}>
							{blocks.map((block: any) => {
								const entries = block.entries || [];
								const first = entries[0];
								const extra = entries.length - 1;
								const cancelled =
									block.code === "cancelled" ||
									(first && first.code === "cancelled");
								const someChange = entries.some(
									(e: any) =>
										e.roomOld ||
										e.subjectOld ||
										e.teacherOld
								);
								return (
									<Pressable
										key={block.id}
										style={({ pressed }) => [
											styles.block,
											styles.dayBlockUniform,
											block.free && styles.blockFree,
											pressed &&
												!block.free &&
												styles.blockPressed,
											cancelled && styles.blockCancelled,
											someChange && styles.blockChanged,
											timetableStyle === "style2" &&
												!cancelled &&
												!someChange &&
												!block.free && {
													borderColor: "#002fffff"
												},
											timetableStyle === "style3" &&
												!cancelled &&
												!someChange &&
												!block.free && {
													borderColor: "#002fffff",
													backgroundColor: "#aabaffff"
												}
										]}
										disabled={block.free || !entries.length}
										onPress={() =>
											openLesson(block.id, selectedDate)
										}>
										{block.free ? (
											<Text
												style={styles.freeText}
												numberOfLines={2}>
												Frei
											</Text>
										) : first ? (
											<View style={styles.lessonLine}>
												<Text
													style={[
														styles.subject,
														cancelled &&
															styles.subjectCancelled
													]}
													numberOfLines={1}
													ellipsizeMode="tail">
													{first.subjectOld && (
														<Text>
															<Text
																style={[
																	styles.meta,
																	styles.subjectOld,
																	cancelled &&
																		styles.metaCancelled
																]}
																numberOfLines={
																	1
																}
																ellipsizeMode="tail">
																{
																	first.subjectOld
																}
															</Text>
															<Text> </Text>
														</Text>
													)}
													{first.subject}
												</Text>
												<Text
													style={[
														styles.meta,
														cancelled &&
															styles.metaCancelled
													]}
													numberOfLines={1}>
													{first.teacherOld && (
														<Text>
															<Text
																style={[
																	styles.meta,
																	styles.metaOld,
																	cancelled &&
																		styles.metaCancelled
																]}
																numberOfLines={
																	1
																}
																ellipsizeMode="tail">
																{
																	first.teacherOld
																}
															</Text>
															<Text> </Text>
														</Text>
													)}
													{first.teacher}
												</Text>
												<Text
													style={[
														styles.meta,
														cancelled &&
															styles.metaCancelled
													]}
													numberOfLines={1}>
													{first.roomOld && (
														<Text>
															<Text
																style={[
																	styles.meta,
																	styles.metaOld,
																	cancelled &&
																		styles.metaCancelled
																]}
																numberOfLines={
																	1
																}
																ellipsizeMode="tail">
																{first.roomOld}
															</Text>
															<Text> </Text>
														</Text>
													)}
													{first.room}
												</Text>
											</View>
										) : null}
										{cancelled && (
											<Text style={styles.cancelledBadge}>
												ENTFÄLLT
											</Text>
										)}
										{someChange && (
											<Text style={styles.changeBadge}>
												ÄNDERUNG
											</Text>
										)}
									</Pressable>
								);
							})}
						</View>
					</View>
				)}

				{!loading && !error && viewMode === "week" && weekStructure && (
					<View style={styles.weekView}>
						{/* Index/Time Column */}
						<View
							style={[
								styles.weekDaySection,
								styles.weekIndexCol
							]}>
							<Text
								style={[
									styles.weekDayHeader,
									styles.indexHeaderText
								]}>
								&nbsp;
							</Text>
							<Text style={styles.weekDayHeaderMini}>&nbsp;</Text>
							{weekStructure.indexData.map((idx) => (
								<View
									key={idx.id}
									style={[
										styles.block,
										styles.blockUniform,
										styles.indexBlock
									]}>
									<Text style={styles.indexBlockTitle}>
										{idx.id}
									</Text>
									{idx.timeRange ? (
										(() => {
											const parts =
												idx.timeRange.split("-");
											const start = parts[0] || "";
											const end = parts[1] || "";
											return (
												<View
													style={{
														alignItems: "center"
													}}>
													<Text
														style={
															styles.indexBlockTime
														}>
														{start}
													</Text>
													<Text
														style={
															styles.indexBlockTime
														}>
														{end}
													</Text>
												</View>
											);
										})()
									) : (
										<Text style={styles.indexBlockTime}>
											{" "}
										</Text>
									)}
								</View>
							))}
						</View>
						{/* Day Columns */}
						{weekStructure.perDay.map((day) => (
							<View key={day.iso} style={styles.weekDaySection}>
								<Text style={styles.weekDayHeader}>
									{day.date.toLocaleDateString("de-DE", {
										weekday: "short"
									})}
								</Text>
								<Text style={styles.weekDayHeaderMini}>
									{formatDisplayShort(day.date)}
								</Text>
								{weekStructure.indexData.map((idx) => {
									const block = day.blocks.find(
										(b) => b.id === idx.id
									);
									if (!block) {
										return (
											<View
												key={idx.id}
												style={[
													styles.block,
													styles.blockUniform,
													styles.blockMin,
													styles.blockPlaceholder
												]}>
												<Text
													style={
														styles.placeholderText
													}>
													--
												</Text>
											</View>
										);
									}
									const entries = block.entries || [];
									const first = entries[0];
									const extra = entries.length - 1;
									return (
										<Pressable
											key={block.id}
											style={({ pressed }) => {
												const cancelled =
													block.code ===
														"cancelled" ||
													(first &&
														first.code ===
															"cancelled");
												const someChange = entries.some(
													(e: any) =>
														e.roomOld ||
														e.subjectOld ||
														e.teacherOld
												);
												return [
													styles.block,
													styles.blockUniform,
													styles.blockMin,
													block.free &&
														styles.blockFree,
													pressed &&
														!block.free &&
														styles.blockPressed,
													cancelled &&
														styles.blockCancelled,
													someChange &&
														styles.blockChanged
												];
											}}
											disabled={
												block.free || !entries.length
											}
											onPress={() =>
												openLesson(block.id, day.date)
											}>
											{block.free ? (
												<Text
													style={styles.freeText}
													numberOfLines={2}>
													Frei
												</Text>
											) : first ? (
												<View style={styles.lessonLine}>
													<Text
														style={[
															styles.subject,
															(block.code ===
																"cancelled" ||
																(first &&
																	first.code ===
																		"cancelled")) &&
																styles.subjectCancelled,
															first.subjectOld &&
																styles.subjectChanged
														]}
														numberOfLines={1}>
														{first.subject}
													</Text>
													<Text
														style={[
															styles.meta,
															(block.code ===
																"cancelled" ||
																(first &&
																	first.code ===
																		"cancelled")) &&
																styles.metaCancelled,
															first.teacherOld &&
																styles.metaChanged
														]}
														numberOfLines={1}>
														{first.teacher}
													</Text>
													<Text
														style={[
															styles.meta,
															(block.code ===
																"cancelled" ||
																(first &&
																	first.code ===
																		"cancelled")) &&
																styles.metaCancelled,
															first.roomOld &&
																styles.metaChanged
														]}
														numberOfLines={1}>
														{first.room}
													</Text>
												</View>
											) : null}
											{(block.code === "cancelled" ||
												(first &&
													first.code ===
														"cancelled")) && (
												<Text
													style={[
														styles.cancelledBadge
													]}>
													<Ionicons
														name="ban"
														style={[
															styles.smallBadge
														]}
													/>
												</Text>
											)}
											{entries.some(
												(e: any) =>
													e.roomOld ||
													e.subjectOld ||
													e.teacherOld
											) && (
												<Text
													style={[
														styles.changeBadge
													]}>
													<Ionicons
														name="swap-horizontal"
														style={[
															styles.smallBadge
														]}
													/>
												</Text>
											)}
											{!block.free && extra > 0 && (
												<Text
													style={
														styles.moreIndicator
													}>
													+{extra}
												</Text>
											)}
										</Pressable>
									);
								})}
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</View>
	);
};

export default Timetable;

const styles = StyleSheet.create({
	wrapper: {
		flex: 1
	},
	container: {
		padding: 10
	},
	scrollInner: {
		paddingBottom: 40,
		marginBottom: 40
	},
	heading: {
		fontSize: 30,
		backgroundColor: "#fcba03",
		padding: 20,
		flex: 1,
		alignItems: "center",
		justifyContent: "space-between"
	},
	semiheading: {
		fontSize: 20,
		padding: 10,
		textAlign: "center",
		marginBottom: 0
	},
	button: {
		fontSize: 15,
		backgroundColor: "#ffcb3dff",
		padding: 10,
		borderRadius: 8,
		textAlign: "center",
		marginBottom: 10
	},
	error: {
		color: "#b00020",
		marginTop: 8,
		textAlign: "center"
	},
	mono: {
		fontFamily: Platform.select({
			ios: "Courier",
			android: "monospace",
			default: "System"
		}),
		fontSize: 12,
		lineHeight: 16,
		color: "#222",
		paddingHorizontal: 8
	},
	headerRow: {
		marginBottom: 0
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 10,
		flexWrap: "wrap"
	},
	actionBtn: {
		backgroundColor: "#ffcb3dff",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 6
	},
	actionBtnPressed: {
		opacity: 0.65
	},
	actionBtnText: {
		fontWeight: "600",
		color: "#222"
	},
	actionBtnIcon: {
		fontSize: 18,
		color: "#222"
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
		elevation: 1
	},
	blockCancelled: {
		backgroundColor: "#ffe5e5",
		borderColor: "#ff5a5a",
		borderWidth: 1,
		position: "relative"
	},
	blockChanged: {
		backgroundColor: "#e6ffecff",
		borderColor: "#32cd32",
		borderWidth: 1,
		position: "relative"
	},
	blockUniform: {
		height: 60,
		justifyContent: "space-between"
	},
	dayBlockUniform: {
		height: 58.5
	},
	blockMin: {
		width: 64
	},
	blockFree: {
		backgroundColor: "#f6f6f6",
		borderStyle: "dashed"
	},
	blockHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 4
	},
	blockTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 1
	},
	moreIndicator: {
		fontSize: 8,
		fontWeight: "600",
		color: "#555"
	},
	freeText: {
		fontStyle: "italic",
		color: "#666"
	},
	lessonLine: {
		marginBottom: 6
	},
	time: {
		fontWeight: "600",
		color: "#333"
	},
	subject: {
		fontSize: 11,
		fontWeight: "700",
		color: "#111"
	},
	subjectOld: {
		textDecorationLine: "line-through"
	},
	meta: {
		fontSize: 10,
		color: "#444"
	},
	metaOld: {
		textDecorationLine: "line-through"
	},
	subjectCancelled: {
		textDecorationLine: "line-through",
		color: "#b30000",
		fontWeight: "700"
	},
	metaCancelled: {
		textDecorationLine: "line-through",
		color: "#cc0000"
	},
	subjectChanged: {
		fontWeight: "900",
		color: "#32cd32"
	},
	metaChanged: {
		fontWeight: "900",
		color: "#32cd32"
	},
	cancelledBadge: {
		position: "absolute",
		top: 4,
		right: 6,
		backgroundColor: "#ff5a5a",
		color: "#fff",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		fontSize: 8,
		fontWeight: "700",
		letterSpacing: 0.5
	},
	changeBadge: {
		position: "absolute",
		top: 4,
		right: 6,
		backgroundColor: "#32cd32",
		color: "#fff",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		fontSize: 8,
		fontWeight: "700",
		letterSpacing: 0.5
	},
	smallBadge: {
		fontSize: 10
	},
	detailBadge: {
		position: "absolute",
		top: 4,
		right: 6,
		zIndex: 10
	},
	classText: {
		fontSize: 10,
		color: "#222",
		opacity: 0.75
	},
	dateSelector: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 30,
		marginBottom: 10
	},
	dateBtn: {
		backgroundColor: "#fcba03",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 44,
		alignItems: "center"
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
		backgroundColor: "#ffe18fff"
	},
	inlineSmallBtnPressed: { opacity: 0.6 },
	inlineSmallBtnText: { fontSize: 12, fontWeight: "600" },
	weekDaySection: { marginBottom: 24 },
	weekDayHeader: { fontSize: 18, fontWeight: "700", textAlign: "center" },
	weekDayHeaderMini: { fontSize: 12, marginBottom: 8, textAlign: "center" },
	weekView: {
		flex: 1,
		flexDirection: "row",
		gap: 5
	},
	dayView: {
		flex: 1,
		flexDirection: "row",
		gap: 5,
		alignItems: "flex-start",
		marginBottom: 16
	},
	weekIndexCol: {
		width: 48
	},
	dayIndexCol: {
		width: 55
	},
	indexHeaderText: { textAlign: "center" },
	indexBlock: {
		alignItems: "center",
		justifyContent: "center",
		gap: 4
	},
	indexBlockTitle: { fontSize: 12, fontWeight: "700", color: "#222" },
	indexBlockTime: {
		fontSize: 10,
		color: "#444",
		textAlign: "center",
		lineHeight: 12,
		paddingTop: 2
	},
	blockPlaceholder: { backgroundColor: "#fafafa", borderStyle: "dotted" },
	placeholderText: { fontSize: 10, color: "#bbb", textAlign: "center" },
	blockPressed: { opacity: 0.7 },
	detailEntry: {
		backgroundColor: "#fafafa",
		borderRadius: 10,
		padding: 10,
		borderWidth: 1,
		borderColor: "#eee"
	},
	detailTime: { fontSize: 12, fontWeight: "600", color: "#222" },
	detailSubject: { fontSize: 14, fontWeight: "700", color: "#111" },
	detailMetaRow: { flexDirection: "row", flexWrap: "wrap" },
	detailMeta: { fontSize: 12, color: "#444" },
	topBar: {
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
		marginBottom: 5
	},
	leftBarGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
	barBtn: {
		backgroundColor: "#ffdc6a",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		minWidth: 60,
		alignItems: "center"
	},
	barBtnPressed: { opacity: 0.65 },
	barIcon: { fontSize: 20, color: "#222", fontWeight: "600" },
	barTitle: { fontSize: 30 },
	barSwitchText: { fontSize: 14, fontWeight: "600", color: "#222" },
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20
	},
	modalCard: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 20,
		width: "100%",
		maxWidth: 360,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 5,
		gap: 16
	},
	modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
	modalActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12
	},
	modalBtn: {
		backgroundColor: "#fcba03",
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center"
	},
	modalBtnSecondary: {
		backgroundColor: "#eee",
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center"
	},
	modalBtnPressed: { opacity: 0.6 },
	modalBtnText: { fontWeight: "600", color: "#222" },
	modalBtnSecondaryText: { fontWeight: "600", color: "#444" }
});
