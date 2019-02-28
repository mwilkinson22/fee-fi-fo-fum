import { detect } from "detect-browser";
const browser = detect();

export function toRgb(colour) {
	return `rgb(${colour.join(",")})`;
}

export function toRgba(colour, a) {
	switch (browser && browser.name) {
		case "edge":
		case "ie":
			return toRgb(colour);
		default:
			return `rgb(${colour.join(",")}, ${a})`;
	}
}

export function toHex(colour, withHash = true) {
	const fullHex = colour.map(num => {
		let hex = num.toString(16);
		if (hex.length === 1) {
			return "0" + hex;
		} else {
			return hex;
		}
	});

	return (withHash ? "#" : "") + fullHex.join("");
}
