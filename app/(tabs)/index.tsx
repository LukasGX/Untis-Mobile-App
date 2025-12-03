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
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=47.55&longitude=10.16&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&wind_speed_unit=kmh&timezone=Europe%2FBerlin`;

const Index = () => {
	const [school, setSchool] = useState<string | null>(null);
	const [username, setUserName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [specialPermissionRequested, setSpecialPermissionRequested] =
		useState<boolean>(false);
	const [hasSpecialPermission, setHasSpecialPermission] =
		useState<boolean>(false);
	const [weather, setWeather] = useState<any>(null);

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

				fetch(WEATHER_URL)
					.then((r) => r.json())
					.then(setWeather);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "Login failed");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	const getWeatherIcon = (code: number) => {
		// WMO codes to emojis
		if (code <= 2) return "☀️"; // clear sky
		if (code <= 3) return "🌤️"; // slightly cloudy
		if (code <= 48) return "☁️"; // cloudy
		if (code <= 67) return "🌦️"; // slightly raining
		if (code <= 77) return "🌧️"; // rain
		if (code <= 86) return "🌨️"; // snow
		return "🌪️"; // storm
	};

	const getBeaufort = (kmh: number) => {
		if (kmh < 1) return 0;
		if (kmh < 6) return 1;
		if (kmh < 12) return 2;
		if (kmh < 20) return 3;
		if (kmh < 29) return 4;
		if (kmh < 39) return 5;
		if (kmh < 50) return 6;
		return 7;
	};

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
				<View style={styles.card}>
					<Text style={{ fontSize: 24, fontWeight: "bold" }}>
						{weather?.current.temperature_2m}°C{" "}
						{getWeatherIcon(weather?.current.weather_code)}
					</Text>
					<Text>
						Wind: {weather?.current.wind_speed_10m} km/h (
						{getBeaufort(weather?.current.wind_speed_10m)} Bft)
					</Text>
					<Text>
						Niederschlag: {weather?.current.precipitation}mm |{" "}
						{weather?.hourly.precipitation_probability[0]}%
					</Text>
				</View>
			</View>
		</View>
	);
};

export default Index;

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#ffffffff",
		padding: 16,
		borderRadius: 8,
		marginTop: 16
	}
});
