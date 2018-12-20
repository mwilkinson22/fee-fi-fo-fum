export function toRgb(colour) {
	return `rgb(${colour.join(",")})`;
}

export function toRgba(colour, a) {
	return `rgb(${colour.join(",")}, ${a})`;
}
