import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebUntis } from "webuntis";
import { sharedStyles } from "../../styles/shared";
import { loadCredentials } from "../../utils/secureCredentials";
import { supabase } from "../../utils/supabase";

const SPECIAL_PERMISSION_REQUESTED_KEY = "specialPermissionRequested";
const SPECIAL_PERMISSION_REQUEST_PENDING_KEY =
	"specialPermissionRequestPending";
const SPECIAL_PERMISSION_OWNING_KEY = "specialPermissionOwning";

const Index = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [specialPermissionRequested, setSpecialPermissionRequested] =
		useState<boolean>(false);
	const [hasSpecialPermission, setHasSpecialPermission] =
		useState<boolean>(false);

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

				const hasPendingRequest = await SecureStore.getItemAsync(
					SPECIAL_PERMISSION_REQUEST_PENDING_KEY
				);

				if (hasPendingRequest === "true") {
					console.log("Fetching status for " + untis.username);
					const fetchData = async () => {
						const { data, error } = await supabase
							.from("requests")
							.select("status")
							.eq("username", untis.username);

						if (error) {
							console.error(
								"Fehler beim Laden der Daten:",
								error
							);
						} else {
							console.log("Daten:", data);
							if (data[0]?.status === "approved") {
								setHasSpecialPermission(true);

								await SecureStore.setItemAsync(
									SPECIAL_PERMISSION_REQUEST_PENDING_KEY,
									"false"
								);

								await SecureStore.setItemAsync(
									SPECIAL_PERMISSION_OWNING_KEY,
									"true"
								);

								setHasSpecialPermission(true);

								Alert.alert(
									"Anfrage für spezielle Berechtigungen genehmigt",
									"Du hast nach einem Neustart Zugriff auf spezielle Funktionen in der App."
								);
							} else if (data[0]?.status === "denied") {
								await SecureStore.setItemAsync(
									SPECIAL_PERMISSION_REQUEST_PENDING_KEY,
									"false"
								);

								await SecureStore.setItemAsync(
									SPECIAL_PERMISSION_OWNING_KEY,
									"false"
								);

								setHasSpecialPermission(false);

								Alert.alert(
									"Anfrage für spezielle Berechtigungen abgelehnt",
									"Deine Anfrage für spezielle Berechtigungen wurde abgelehnt."
								);
							} else {
								Alert.alert(
									"Anfrage für spezielle Berechtigungen",
									"Deine Anfrage für spezielle Berechtigungen ist noch in Bearbeitung"
								);
							}
						}
					};

					fetchData();
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
			<View style={sharedStyles.container}>
				{error ? (
					<Text style={sharedStyles.errorText}>{error}</Text>
				) : (
					<Text style={sharedStyles.semiHeading}>
						Willkommen, {username ?? "Loading..."}!
					</Text>
				)}
			</View>
		</View>
	);
};

export default Index;

const styles = StyleSheet.create({});
