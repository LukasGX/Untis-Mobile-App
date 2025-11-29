import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

// Credentials now sourced from secure storage

const Messages = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [inbox, setInbox] = useState<any[] | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const insets = useSafeAreaInsets();

	const formatMessageText = (text: string) => {
		// Doppelte Spaces → Zeilenumbrüche
		let formatted = text.replace(/\s{2,}/g, "\n");

		// Listen mit Bindestrich nach Doppelpunkt
		formatted = formatted.replace(/:\s*-/g, ":\n-");

		// Doppelpunkte als Absatztrenner
		formatted = formatted.replace(/:\s\n/g, ":\n\n");

		return formatted
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
	};

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
				if (isMounted) {
					setSchool(untis.school);
					setUserName(untis.username);
				}
				// Fetch inbox/messages
				try {
					if (!(untis as any).getInbox) {
						if (isMounted)
							setError(
								"getInbox ist auf dem WebUntis-Objekt nicht verfügbar"
							);
					} else {
						const inboxResult = await (untis as any).getInbox();
						let parsed: any[] | null = null;
						if (
							inboxResult &&
							inboxResult.incomingMessages &&
							Array.isArray(inboxResult.incomingMessages)
						) {
							parsed = inboxResult.incomingMessages;
						} else if (Array.isArray(inboxResult)) {
							parsed = inboxResult;
						} else if (
							inboxResult &&
							typeof inboxResult === "object"
						) {
							parsed = Object.values(inboxResult)
								.flat()
								.filter(Array.isArray);
						}
						if (parsed && parsed.length > 0 && isMounted)
							setInbox(parsed);
					}
				} catch (inboxErr: any) {
					if (isMounted)
						setError(
							inboxErr?.message ||
								"Fehler beim Laden der Mitteilungen"
						);
				}
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			} finally {
				if (isMounted) setLoading(false);
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={[sharedStyles.container, { paddingBottom: 120 }]}>
				<Text style={sharedStyles.semiHeading}>Mitteilungen</Text>
				{error ? (
					<Text>{error}</Text>
				) : loading ? (
					<Text> Lade Mitteilungen... </Text>
				) : inbox && inbox.length > 0 ? (
					<ScrollView
						contentContainerStyle={{
							paddingBottom: Math.max(24, insets.bottom + 8)
						}}>
						{inbox?.map(
							(msg: any, idx: number) => (
								console.log(msg),
								(
									<View
										key={msg.id || idx}
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
											{msg.subject ||
												`Nachricht ${idx + 1}`}
										</Text>
										<Text
											style={{
												color: "#666",
												fontSize: 14,
												marginBottom: 8
											}}>
											{msg.sender?.displayName ||
												"Unbekannt"}{" "}
											•{" "}
											{new Date(
												msg.sentDateTime
											).toLocaleDateString("de-DE", {
												day: "numeric",
												month: "short",
												year: "numeric"
											})}
										</Text>
										<View
											style={{
												flex: 1,
												marginBottom: 8
											}}>
											{formatMessageText(
												msg.contentPreview || ""
											).map((line, i) => (
												<Text
													key={i}
													style={{
														lineHeight: 20,
														marginBottom:
															i <
															formatMessageText(
																msg.contentPreview ||
																	""
															).length -
																1
																? 4
																: 0
													}}>
													{line}
												</Text>
											))}
										</View>
										{msg.hasAttachments && (
											<Text
												style={{
													color: "blue",
													fontSize: 12,
													marginTop: 4
												}}>
												📎 Anhang
											</Text>
										)}
									</View>
								)
							)
						)}
					</ScrollView>
				) : (
					<Text>Keine Mitteilungen</Text>
				)}
			</View>
		</View>
	);
};

export default Messages;

const styles = StyleSheet.create({});
