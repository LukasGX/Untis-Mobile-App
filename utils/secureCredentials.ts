import * as SecureStore from "expo-secure-store";

const KEY = "untisCredentials";

export interface UntisCredentials {
	school: string;
	user: string;
	password: string;
	host: string;
	colors?: Record<string, string>;
}

// Default colors used when no colors are stored in secure storage
const DEFAULT_COLORS: Record<string, string> = {
	Ethik_bd: "#FFFFFF",
	Ethik_bg: "#FFFFFF",
	Ethik_t: "#000000",
	Evangelisch_bd: "#FFFFFF",
	Evangelisch_bg: "#FFFFFF",
	Evangelisch_t: "#000000",
	Katholisch_bd: "#FFFFFF",
	Katholisch_bg: "#FFFFFF",
	Katholisch_t: "#000000",
	Chemie_bd: "#757575",
	Chemie_bg: "#dfdfdfff",
	Chemie_t: "#000000",
	Englisch_bd: "#0CFD0C",
	Englisch_bg: "#c7ffc7ff",
	Englisch_t: "#000000",
	Geographie_bd: "#7D5300",
	Geographie_bg: "#e1c998ff",
	Geographie_t: "#000000",
	Kunst_bd: "#FFFFFF",
	Kunst_bg: "#FFFFFF",
	Kunst_t: "#000000",
	Musik_bd: "#FFBA0A",
	Musik_bg: "#ffde89ff",
	Musik_t: "#000000",
	"Sport (m)_bd": "#FFFFFF",
	"Sport (m)_bg": "#FFFFFF",
	"Sport (m)_t": "#000000",
	"Sport (w)_bd": "#FFFFFF",
	"Sport (w)_bg": "#FFFFFF",
	"Sport (w)_t": "#000000",
	Latein_bd: "#FFFF0F",
	Latein_bg: "#ffffa2ff",
	Latein_t: "#000000",
	Französisch_bd: "#FFFF0F",
	Französisch_bg: "#ffffa2ff",
	Französisch_t: "#000000",
	Deutsch_bd: "#FF0F0F",
	Deutsch_bg: "#ffa6a6ff",
	Deutsch_t: "#000000",
	Physik_bd: "#0FF2E3",
	Physik_bg: "#8afff7ff",
	Physik_t: "#000000",
	Geschichte_bd: "#FFAA00",
	Geschichte_bg: "#ffd480ff",
	Geschichte_t: "#000000",
	Mathematik_bd: "#334EFF",
	Mathematik_bg: "#93a2ffff",
	Mathematik_t: "#000000",
	"Wirtschaft und Recht_bd": "#D1D1D1",
	"Wirtschaft und Recht_bg": "#e6e6e6ff",
	"Wirtschaft und Recht_t": "#000000",
	Wirtschaftsinformatik_bd: "#D1D1D1",
	Wirtschaftsinformatik_bg: "#e6e6e6ff",
	Wirtschaftsinformatik_t: "#000000",
	Informatik_bd: "#D1D1D1",
	Informatik_bg: "#e6e6e6ff",
	Informatik_t: "#000000",
	Biologie_bd: "#44693F",
	Biologie_bg: "#a7d4a1ff",
	Biologie_t: "#000000"
};

export const SUBJECTS_WITH_KEYS_LV = [
	{ label: "Ethik", value: "eth" },
	{ label: "Evangelisch", value: "ev" },
	{ label: "Katholisch", value: "kat" },
	{ label: "Chemie", value: "c" },
	{ label: "Englisch", value: "e" },
	{ label: "Geographie", value: "geo" },
	{ label: "Kunst", value: "ku" },
	{ label: "Musik", value: "mu" },
	{ label: "Sport (m)", value: "sm" },
	{ label: "Sport (w)", value: "sw" },
	{ label: "Latein", value: "l" },
	{ label: "Französisch", value: "fr" },
	{ label: "Deutsch", value: "d" },
	{ label: "Physik", value: "ph" },
	{ label: "Geschichte", value: "g" },
	{ label: "Mathematik", value: "m" },
	{ label: "Wirtschaft und Recht", value: "wr" },
	{ label: "Wirtschaftsinformatik", value: "winf" },
	{ label: "Informatik", value: "inf" },
	{ label: "Biologie", value: "bio" }
];

export const GRADE_TYPES_LV = [
	{ label: "Großer Test", value: "big" },
	{ label: "Kleiner Test", value: "small" },
	{ label: "Stegreifaufgabe", value: "ex" },
	{ label: "Rechenschaftsablage", value: "rech" },
	{ label: "Referat", value: "ref" },
	{ label: "Unterrichtsbeitrag", value: "ub" }
];

export const WEIGHTING_LV = [
	{ label: "Einfach", value: "1" },
	{ label: "Doppelt", value: "2" },
	{ label: "Dreifach", value: "3" }
];

export const GRADES_LV = [
	{ label: "Sehr gut (1)", value: "1" },
	{ label: "Gut (2)", value: "2" },
	{ label: "Befriedigend (3)", value: "3" },
	{ label: "Ausreichend (4)", value: "4" },
	{ label: "Mangelhaft (5)", value: "5" },
	{ label: "Ungenügend (6)", value: "6" }
];

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

// Convenience helper to get colors (returns defaults when no creds/colors present)
export function getStoredColors(
	creds: UntisCredentials | null
): Record<string, string> {
	if (!creds || !creds.colors) return DEFAULT_COLORS;
	return { ...DEFAULT_COLORS, ...creds.colors };
}
