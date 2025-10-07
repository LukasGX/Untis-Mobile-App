import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";

// Credentials now sourced from secure storage

const Index = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const stored = await loadCredentials();
				if (!stored) {
					if (isMounted) setError("Nicht eingeloggt");
					return;
				}
				const untis = new WebUntis(stored.school, stored.user, stored.password, stored.host);
				await untis.login();
				if (isMounted) {
					setSchool(untis.school);
					setUserName(untis.username);
				}
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
			<View style={sharedStyles.container}>{error ? <Text style={sharedStyles.errorText}>{error}</Text> : <Text style={sharedStyles.semiHeading}>Willkommen, {username ?? "Loading..."}!</Text>}</View>
		</View>
	);
};

export default Index;

const styles = StyleSheet.create({});
