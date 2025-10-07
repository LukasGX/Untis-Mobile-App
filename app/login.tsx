import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { WebUntis } from "webuntis";
import { loadCredentials, saveCredentials } from "../utils/secureCredentials";

const Login = () => {
	const [school, setSchool] = useState("");
	const [user, setUser] = useState("");
	const [password, setPassword] = useState("");
	const [host, setHost] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Prefill if previously saved
		(async () => {
			try {
				const stored = await loadCredentials();
				if (stored) {
					setSchool(stored.school);
					setUser(stored.user);
					setPassword(stored.password);
					setHost(stored.host);
				}
			} catch {}
		})();
	}, []);

	const handleLogin = async () => {
		setError(null);
		if (!school || !user || !password || !host) {
			setError("Bitte alle Felder ausfüllen.");
			return;
		}
		setLoading(true);
		try {
			const untis = new WebUntis(school.trim(), user.trim(), password, host.trim());
			await untis.login();
			await saveCredentials({ school: school.trim(), user: user.trim(), password, host: host.trim() });
			// (Optional) store in a global singleton for reuse by tab screens
			// You can later move this to secure storage.
			// Navigate to tabs root
			router.replace("/(tabs)");
		} catch (e: any) {
			setError(e?.message || "Login fehlgeschlagen");
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
			<Text style={styles.heading}>Untis+</Text>
			<View style={styles.container}>
				<Text style={styles.sheading}>Login</Text>
				<TextInput style={styles.input} placeholder="Schulname" value={school} onChangeText={setSchool} autoCapitalize="none" />
				<TextInput style={styles.input} placeholder="Benutzername" value={user} onChangeText={setUser} autoCapitalize="none" />
				<TextInput style={styles.input} placeholder="Passwort" value={password} onChangeText={setPassword} secureTextEntry />
				<TextInput style={styles.input} placeholder="Host" value={host} onChangeText={setHost} autoCapitalize="none" />
				{error && <Text style={styles.error}>{error}</Text>}
				<Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleLogin} disabled={loading}>
					<Text style={styles.buttonText}>{loading ? "Einloggen..." : "Login"}</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
};

export default Login;

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: "#fff",
	},
	container: {
		marginHorizontal: 24,
		padding: 24,
		borderRadius: 12,
		backgroundColor: "#f9f9f9",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		marginTop: 80,
	},
	heading: {
		fontSize: 30,
		backgroundColor: "#fcba03",
		padding: 20,
		textAlign: "center",
	},
	sheading: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 24,
		textAlign: "center",
		color: "#222",
	},
	input: {
		borderWidth: 1,
		borderColor: "#e3e3e3",
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
		fontSize: 16,
		backgroundColor: "#fff",
	},
	button: {
		backgroundColor: "#fcba03",
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 8,
	},
	buttonPressed: {
		opacity: 0.7,
	},
	buttonText: {
		fontWeight: "700",
		fontSize: 16,
		color: "#222",
	},
	error: {
		color: "#b00020",
		marginBottom: 8,
		textAlign: "center",
	},
});
