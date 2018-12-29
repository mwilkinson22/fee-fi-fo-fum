import { detect } from "detect-browser";
const browser = detect();
console.log(browser);

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
