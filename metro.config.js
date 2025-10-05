// Custom Metro configuration to ensure .mjs modules (e.g., date-fns v3) resolve correctly
// and to keep compatibility with Expo's default settings.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure .mjs is included explicitly (should already be, but we enforce it for clarity)
if (!config.resolver.sourceExts.includes("mjs")) {
	config.resolver.sourceExts.push("mjs");
}

module.exports = config;
