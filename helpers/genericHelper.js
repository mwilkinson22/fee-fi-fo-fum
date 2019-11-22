export function nestedObjectToDot(object, pullObjectsContaining = null) {
	const result = {};
	(function recurse(obj, current) {
		for (var key in obj) {
			var value = obj[key];
			var newKey = current ? current + "." + key : key;
			//pullObjectsContaining allows us to stop recursion once
			//we find an object containing a specific value. Useful
			//when we want to pull a react-select object for value injections
			if (value && typeof value === "object" && value[pullObjectsContaining] === undefined) {
				recurse(value, newKey);
			} else {
				result[newKey] = value;
			}
		}
	})(object);

	return result;
}
