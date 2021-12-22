import { detect } from "detect-browser";
import Colour from "color";
const browser = detect();

export function toRgba(c, a) {
	switch (browser && browser.name) {
		case "edge":
		case "ie":
			return c;
		default:
			return Colour(c).alpha(a).rgb();
	}
}
