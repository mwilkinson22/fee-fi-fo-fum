export function nestedObjectToDot(object) {
	const result = {};
	(function recurse(obj, current) {
		for (var key in obj) {
			var value = obj[key];
			var newKey = current ? current + "." + key : key;
			if (value && typeof value === "object") {
				recurse(value, newKey);
			} else {
				result[newKey] = value;
			}
		}
	})(object);

	return result;
}
