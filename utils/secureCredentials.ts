import * as SecureStore from "expo-secure-store";

const KEY = "untisCredentials";

export interface UntisCredentials {
	school: string;
	user: string;
	password: string;
	host: string;
}

export async function saveCredentials(creds: UntisCredentials): Promise<void> {
	await SecureStore.setItemAsync(KEY, JSON.stringify(creds));
}

export async function loadCredentials(): Promise<UntisCredentials | null> {
	const raw = await SecureStore.getItemAsync(KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export async function clearCredentials(): Promise<void> {
	await SecureStore.deleteItemAsync(KEY);
}
