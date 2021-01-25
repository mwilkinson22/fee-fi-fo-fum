export function logTime(date, prefix = null, reset = false) {
	const now = new Date();
	console.info(`${prefix ? `${prefix} ` : ""}${now - date}ms`);

	if (reset) {
		date.setTime(now.getTime());
	}
}
