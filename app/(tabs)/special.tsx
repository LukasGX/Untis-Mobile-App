import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import { createUntis, realTimetable } from "../../method";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

// Credentials now sourced from secure storage

const Special = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [untis, setUntis] = useState<any | null>(null);

	const [showRawModal, setShowRawModal] = useState(false);
	const [rawLoading, setRawLoading] = useState(false);
	const [rawError, setRawError] = useState<string | null>(null);
	const [rawData, setRawData] = useState<any | null>(null);
	const [rawDataType, setRawDataType] = useState<string | null>(null);
	const [rawDataNote, setRawDataNote] = useState<string>("");
	const [showChoiceModal, setShowChoiceModal] = useState(false);
	const [showChoiceNetworkModal, setShowChoiceNetworkModal] = useState(false);
	const [selectedType, setSelectedType] = useState<string | null>(null);

	const [showNetworkModal, setShowNetworkModal] = useState(false);
	const [networkLoading, setNetworkLoading] = useState(false);
	const [networkError, setNetworkError] = useState<string | null>(null);
	const [networkData, setNetworkData] = useState<any | null>(null);
	const [networkType, setNetworkType] = useState<string | null>(null);
	const [networkNote, setNetworkNote] = useState<string>("");

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const stored = await loadCredentials();
				if (!stored) {
					if (isMounted) setError("Nicht eingeloggt");
					return;
				}
				const untis = createUntis(
					stored.school,
					stored.user,
					stored.password,
					stored.host
				);
				await untis.login();
				setUntis(untis);
				if (isMounted) {
					setSchool(untis.school);
					setUserName(untis.username || stored.user);
				}
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	const handleRawDataView = async (type: string) => {
		setShowChoiceModal(false);
		setSelectedType(type);
		setShowRawModal(true);
		setRawLoading(false);
		setRawError(null);

		switch (type) {
			case "timetable":
				setRawDataType("Stundenplan");
				setRawDataNote("");
				const timetableData = await untis.getOwnTimetableFor(
					new Date()
				);
				setRawData(timetableData);
				break;
			case "homework":
				setRawDataType("Hausaufgaben");
				setRawDataNote("");
				const hwData = await untis.getHomeWorksFor(
					new Date(new Date().setDate(new Date().getDate() - 1)),
					new Date(new Date().setDate(new Date().getDate() + 14))
				);
				setRawData(hwData);
				break;
			case "messages":
				setRawDataType("Mitteilungen");
				setRawDataNote("");
				const messagesData = await untis.getInbox();
				setRawData(messagesData);
				break;
			case "subjects":
				setRawDataType("Fächer");
				setRawDataNote("");
				const subjectsData = await untis.getSubjects();
				setRawData(subjectsData);
				break;
			case "classes":
				setRawDataType("Klassen");
				setRawDataNote("");
				const classesData = await untis.getClasses();
				setRawData(classesData);
				break;
			case "statusdata":
				setRawDataType("Statusdaten");
				setRawDataNote("");
				const statusData = await untis.getStatusData();
				setRawData(statusData);
				break;
			case "teachers":
				setRawDataType("Lehrer");
				setRawDataNote("");
				const teachersData = await untis.getTeachers();
				setRawData(teachersData);
				break;
			case "rooms":
				setRawDataType("Räume");
				setRawDataNote("");
				const roomsData = await untis.getRooms();
				setRawData(roomsData);
				break;
			case "students":
				setRawDataType("Schüler");
				setRawDataNote(
					"Hinweis: Aus datenschutzrechtlichen Gründen werden Schülerdaten nicht angezeigt."
				);
				setRawData(null);
				break;
			case "timegrid":
				setRawDataType("Zeiten");
				setRawDataNote("");
				const timegridData = await untis.getTimegrid();
				setRawData(timegridData);
				break;
		}
	};

	const handleNetwork = async (type: string) => {
		setShowChoiceNetworkModal(false);
		setShowNetworkModal(true);
		setNetworkLoading(false);
		setNetworkError(null);

		switch (type) {
			case "timetable":
				setNetworkType("Stundenplan");
				setNetworkNote("");
				const data = await realTimetable(
					untis,
					new Date(),
					false,
					true
				);
				setNetworkData(data);
				break;
		}
	};

	return (
		<View style={sharedStyles.screen}>
			<Modal
				visible={showRawModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowRawModal(false)}>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.4)",
						justifyContent: "center",
						alignItems: "center",
						padding: 20
					}}>
					<View
						style={{
							backgroundColor: "#fff",
							borderRadius: 12,
							padding: 16,
							width: "100%",
							maxWidth: 720
						}}>
						<Text
							style={{
								fontSize: 18,
								fontWeight: "700",
								textAlign: "center",
								marginBottom: 4
							}}>
							Rohdaten - {rawDataType}
						</Text>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "300",
								textAlign: "center"
							}}>
							{rawDataNote}
						</Text>
						{rawLoading && (
							<ActivityIndicator style={{ marginVertical: 12 }} />
						)}
						{rawError && !rawLoading && (
							<Text
								style={{ color: "#b00020", marginVertical: 8 }}>
								{rawError}
							</Text>
						)}
						{!rawLoading && !rawError && rawData != undefined && (
							<ScrollView
								style={{
									maxHeight: 420,
									marginVertical: 8
								}}
								contentContainerStyle={{ padding: 8 }}>
								<Text
									style={{
										fontFamily: Platform.select({
											ios: "Courier",
											android: "monospace",
											default: "System"
										}),
										fontSize: 12
									}}>
									{JSON.stringify(rawData, null, 2)}
								</Text>
							</ScrollView>
						)}

						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								gap: 12
							}}>
							<Pressable
								style={({ pressed }) => [
									{
										backgroundColor: "#fcba03",
										flex: 1,
										paddingVertical: 10,
										borderRadius: 8,
										alignItems: "center",
										marginTop: 8
									},
									pressed && { opacity: 0.7 }
								]}
								onPress={() => setShowRawModal(false)}>
								<Text style={{ fontWeight: "600" }}>
									Schließen
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			<Modal
				visible={showNetworkModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowNetworkModal(false)}>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.4)",
						justifyContent: "center",
						alignItems: "center",
						padding: 20
					}}>
					<View
						style={{
							backgroundColor: "#fff",
							borderRadius: 12,
							padding: 16,
							width: "100%",
							maxWidth: 720
						}}>
						<Text
							style={{
								fontSize: 18,
								fontWeight: "700",
								textAlign: "center",
								marginBottom: 4
							}}>
							Netzwerk - {networkType}
						</Text>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "300",
								textAlign: "center"
							}}>
							{networkNote}
						</Text>
						{networkLoading && (
							<ActivityIndicator style={{ marginVertical: 12 }} />
						)}
						{networkError && !rawLoading && (
							<Text
								style={{ color: "#b00020", marginVertical: 8 }}>
								{networkError}
							</Text>
						)}
						{!networkLoading &&
							!networkError &&
							networkData != undefined && (
								<ScrollView
									style={{
										maxHeight: 420,
										marginVertical: 8
									}}
									contentContainerStyle={{ padding: 8 }}>
									{networkData.map(
										(element: any, index: number) => (
											<View key={index}>
												{element.hideFromNetwork ==
												true ? null : (
													<View
														key={index}
														style={{
															marginBottom: 16
														}}>
														<Text
															style={{
																fontFamily:
																	Platform.select(
																		{
																			ios: "Courier",
																			android:
																				"monospace",
																			default:
																				"System"
																		}
																	),
																fontSize: 12,
																fontWeight:
																	"bold"
															}}>
															Request:
														</Text>
														<Text
															style={{
																fontFamily:
																	Platform.select(
																		{
																			ios: "Courier",
																			android:
																				"monospace",
																			default:
																				"System"
																		}
																	),
																fontSize: 12
															}}>
															{element.request}
														</Text>
														<Text
															style={{
																fontFamily:
																	Platform.select(
																		{
																			ios: "Courier",
																			android:
																				"monospace",
																			default:
																				"System"
																		}
																	),
																fontSize: 12,
																fontWeight:
																	"bold",
																marginTop: 8
															}}>
															Response:
														</Text>
														<Text
															style={{
																fontFamily:
																	Platform.select(
																		{
																			ios: "Courier",
																			android:
																				"monospace",
																			default:
																				"System"
																		}
																	),
																fontSize: 12
															}}>
															{JSON.stringify(
																element.response,
																null,
																2
															)}
														</Text>
													</View>
												)}
											</View>
										)
									)}
								</ScrollView>
							)}

						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								gap: 12
							}}>
							<Pressable
								style={({ pressed }) => [
									{
										backgroundColor: "#fcba03",
										flex: 1,
										paddingVertical: 10,
										borderRadius: 8,
										alignItems: "center",
										marginTop: 8
									},
									pressed && { opacity: 0.7 }
								]}
								onPress={() => setShowNetworkModal(false)}>
								<Text style={{ fontWeight: "600" }}>
									Schließen
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={sharedStyles.semiHeading}>Spezialfunktionen</Text>

				<TouchableOpacity
					style={[sharedStyles.button]}
					onPress={() => setShowChoiceModal(true)}>
					<Text>Rohdatenansicht</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[sharedStyles.button]}
					onPress={() => setShowChoiceNetworkModal(true)}>
					<Text>Netzwerk</Text>
				</TouchableOpacity>

				<Modal
					visible={showChoiceModal}
					transparent
					animationType="fade"
					onRequestClose={() => setShowChoiceModal(false)}>
					<ScrollView
						style={{
							flex: 1,
							backgroundColor: "rgba(0,0,0,0.4)",
							padding: 20
						}}
						contentContainerStyle={{
							justifyContent: "center",
							alignItems: "center"
						}}>
						<View
							style={{
								backgroundColor: "#fff",
								borderRadius: 12,
								padding: 16,
								width: "100%",
								maxWidth: 420
							}}>
							<Text
								style={{
									fontSize: 18,
									fontWeight: "700",
									textAlign: "center",
									marginBottom: 12
								}}>
								Rohdatenansicht wählen
							</Text>
							<View style={{ gap: 8 }}>
								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("timetable")
									}>
									<Text style={{ fontWeight: "600" }}>
										Stundenplan
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("homework")
									}>
									<Text style={{ fontWeight: "600" }}>
										Hausaufgaben
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("messages")
									}>
									<Text style={{ fontWeight: "600" }}>
										Mitteilungen
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("subjects")
									}>
									<Text style={{ fontWeight: "600" }}>
										Fächer
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("classes")
									}>
									<Text style={{ fontWeight: "600" }}>
										Klassen
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("statusdata")
									}>
									<Text style={{ fontWeight: "600" }}>
										Statusdaten
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("teachers")
									}>
									<Text style={{ fontWeight: "600" }}>
										Lehrer
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() => handleRawDataView("rooms")}>
									<Text style={{ fontWeight: "600" }}>
										Räume
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("students")
									}>
									<Text style={{ fontWeight: "600" }}>
										Schüler
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										handleRawDataView("timegrid")
									}>
									<Text style={{ fontWeight: "600" }}>
										Zeiten
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#fcba03",
											paddingVertical: 10,
											borderRadius: 8,
											alignItems: "center",
											marginTop: 8
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() => setShowChoiceModal(false)}>
									<Text style={{ fontWeight: "600" }}>
										Abbrechen
									</Text>
								</Pressable>
							</View>
						</View>
					</ScrollView>
				</Modal>

				<Modal
					visible={showChoiceNetworkModal}
					transparent
					animationType="fade"
					onRequestClose={() => setShowChoiceNetworkModal(false)}>
					<ScrollView
						style={{
							flex: 1,
							backgroundColor: "rgba(0,0,0,0.4)",
							padding: 20
						}}
						contentContainerStyle={{
							justifyContent: "center",
							alignItems: "center"
						}}>
						<View
							style={{
								backgroundColor: "#fff",
								borderRadius: 12,
								padding: 16,
								width: "100%",
								maxWidth: 420
							}}>
							<Text
								style={{
									fontSize: 18,
									fontWeight: "700",
									textAlign: "center",
									marginBottom: 12
								}}>
								Rohdatenansicht wählen
							</Text>
							<View style={{ gap: 8 }}>
								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#e6f0ff",
											paddingVertical: 12,
											borderRadius: 8,
											alignItems: "center"
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() => handleNetwork("timetable")}>
									<Text style={{ fontWeight: "600" }}>
										Stundenplan
									</Text>
								</Pressable>

								<Pressable
									style={({ pressed }) => [
										{
											backgroundColor: "#fcba03",
											paddingVertical: 10,
											borderRadius: 8,
											alignItems: "center",
											marginTop: 8
										},
										pressed && { opacity: 0.7 }
									]}
									onPress={() =>
										setShowChoiceNetworkModal(false)
									}>
									<Text style={{ fontWeight: "600" }}>
										Abbrechen
									</Text>
								</Pressable>
							</View>
						</View>
					</ScrollView>
				</Modal>
			</View>
		</View>
	);
};

export default Special;

const styles = StyleSheet.create({});
