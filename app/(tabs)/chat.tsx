import React, { useEffect, useRef, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { WebUntis } from "webuntis";
import data from "../../credentials.json";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

interface Message {
	id: number;
	sent_at: string;
	username: string;
	message: string;
	deleted?: boolean;
}

interface WsEvent {
	type: string;
	id?: number;
	sent_at?: string;
	username?: string;
	message?: string;
	deleted?: boolean;
	school?: string;
}

const Chat = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [untis, setUntis] = useState<any>();
	const [message, setMsg] = useState<string>("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const wsRef = useRef<WebSocket | null>(null);

	const API_TOKEN = data.api_token;

	// WebSocket Cleanup
	useEffect(() => {
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

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
					setUntis(untis);
				}
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (school) {
			fetchMessages();
		}
	}, [school]);

	const sendMessage = async () => {
		if (!validateLength(message)) {
			sendError(
				"Die Nachricht muss zwischen 2 und 60 Zeichen lang sein."
			);
			return;
		}

		try {
			const response = await fetch(
				"http://217.154.161.106:8000/send_message/",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": API_TOKEN
					},
					body: JSON.stringify({
						school: school ?? "",
						username: username ?? "",
						message: message.trim()
					})
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail || "Nachricht konnte nicht gesendet werden"
				);
			}
			setMsg("");
		} catch (err: any) {
			sendError(err.message);
		}
	};

	const fetchMessages = async () => {
		try {
			setLoading(true);
			const schoolValue = school?.trim();
			const response = await fetch(
				"http://217.154.161.106:8000/get_messages/",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": API_TOKEN
					},
					body: JSON.stringify({
						school: schoolValue
					})
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("ERROR:", errorText);
				throw new Error(errorText);
			}

			const data: Message[] = await response.json();
			setMessages(data);
			setError(null);

			// WebSocket mit school dynamisch!
			if (wsRef.current) {
				wsRef.current.close();
			}
			const ws = new WebSocket(
				`ws://217.154.161.106:8000/ws/${schoolValue}?token=${API_TOKEN}`
			);
			wsRef.current = ws;

			ws.onopen = () => console.log("WS verbunden");
			ws.onmessage = (e) => {
				const event: WsEvent = JSON.parse(e.data);
				console.log("WS Event:", event);

				switch (event.type) {
					case "message_new":
						setMessages((prev) => [event as Message, ...prev]);
						break;
					case "message_deleted":
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === event.id
									? { ...msg, deleted: true }
									: msg
							)
						);
						break;
					case "message_restored":
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === event.id
									? {
											...msg,
											deleted: false,
											message:
												event.message || msg.message
									  }
									: msg
							)
						);
						break;
				}
			};
			ws.onerror = (e) => console.error("WS Error:", e);
			ws.onclose = () => {
				console.log("WS getrennt");
				Alert.alert(
					"Verbindung verloren",
					"Die Verbindung zum Server wurde verloren"
				);
			};
		} catch (err: any) {
			setError(err.message);
			console.log(`ERROR: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const validateLength = (message: string): boolean => {
		return message.trim().length >= 2 && message.trim().length <= 60;
	};

	const sendError = (message: string) => {
		Alert.alert("Nachricht kann nicht gesendet werden", message);
	};

	return (
		<View style={sharedStyles.screen}>
			<Text style={sharedStyles.heading}>Untis+</Text>
			<View style={sharedStyles.container}>
				<Text style={[sharedStyles.semiHeading, { marginBottom: 0 }]}>
					Chat
				</Text>
				<Text style={[styles.warning, { marginBottom: 8 }]}>
					WARNUNG: Dieser Chat ist für alle Schüler und Lehrer deiner
					Schule sichtbar. Bei unangebrachten Nachrichten kannst du
					vom Chat ausgeschlossen werden.
				</Text>
				<Text style={styles.warning}>
					Alle Nachrichten verbleiben für 30 Tage auf dem Untis+
					Server
				</Text>

				<View style={styles.chat}>
					<ScrollView style={styles.innerChat}>
						{loading ? (
							<Text style={styles.nomsg}>
								Lade Nachrichten...
							</Text>
						) : messages.length === 0 ? (
							<Text style={styles.nomsg}>
								Keine Nachrichten...
							</Text>
						) : (
							messages.map((msg) => (
								<View
									key={msg.id}
									style={[
										styles.messageContainer,
										msg.username === "[SYSTEM]" &&
											styles.systemMsg
									]}>
									<Text
										style={[
											styles.username,
											msg.username == "[SYSTEM]" &&
												styles.systemTag
										]}>
										{msg.username == "[SYSTEM]"
											? "SYSTEM"
											: msg.username}
									</Text>
									<Text style={styles.timestamp}>
										{new Date(msg.sent_at).toLocaleString(
											"de-DE"
										)}
									</Text>
									{msg.deleted ? (
										<Text style={styles.deletedMsg}>
											Nachricht gelöscht
										</Text>
									) : (
										<Text style={styles.messageText}>
											{msg.message}
										</Text>
									)}
								</View>
							))
						)}
					</ScrollView>
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.input}
							placeholder="Nachricht..."
							value={message}
							onChangeText={setMsg}
							autoCapitalize="sentences"
							multiline
							maxLength={60}
						/>
						<TouchableOpacity
							style={[sharedStyles.button, styles.sendButton]}
							onPress={sendMessage}
							disabled={!validateLength(message)}>
							<Text style={styles.sendButtonText}>Senden</Text>
						</TouchableOpacity>
					</View>
				</View>

				{error && <Text style={styles.error}>{error}</Text>}
			</View>
		</View>
	);
};

export default Chat;

const styles = StyleSheet.create({
	warning: {
		color: "#747474ff",
		textAlign: "center",
		marginBottom: 15,
		fontSize: 11
	},
	chat: {
		marginHorizontal: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: "#f9f9f9",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		flex: 1,
		minHeight: 450
	},
	innerChat: {
		paddingVertical: 12,
		flex: 1
	},
	inputContainer: {
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "#e5e7eb"
	},
	input: {
		borderWidth: 1,
		borderColor: "#e3e3e3",
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		fontSize: 16,
		backgroundColor: "#fff",
		minHeight: 44,
		textAlignVertical: "center"
	},
	sendButton: {},
	sendButtonText: {
		textAlign: "center"
	},
	nomsg: {
		fontStyle: "italic",
		textAlign: "center",
		color: "#6b7280",
		padding: 20
	},
	messageContainer: {
		backgroundColor: "white",
		padding: 16,
		marginVertical: 4,
		borderRadius: 12,
		marginHorizontal: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2
	},
	systemTag: {
		color: "#ff0000ff"
	},
	systemMsg: {
		backgroundColor: "#ffefe2ff"
	},
	username: {
		fontWeight: "600",
		fontSize: 16,
		color: "#1f2937",
		marginBottom: 2
	},
	timestamp: {
		fontSize: 12,
		color: "#6b7280",
		marginBottom: 6
	},
	messageText: {
		fontSize: 15,
		color: "#374151",
		lineHeight: 20
	},
	deletedMsg: {
		fontSize: 14,
		color: "#9ca3af",
		fontStyle: "italic"
	},
	error: {
		color: "#ef4444",
		textAlign: "center",
		padding: 10,
		fontSize: 14
	}
});
