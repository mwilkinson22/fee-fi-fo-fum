import _ from "lodash";

export function nestedObjectToDot(object, pullObjectsContaining = null) {
	const result = {};
	(function recurse(obj, current) {
		for (let key in obj) {
			const value = obj[key];
			const newKey = current ? current + "." + key : key;
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

export function urlQueryHandler(str) {
	return _.fromPairs(
		str
			.replace(/^\?/, "")
			.split("&")
			.map(s => {
				const arr = s.split("=");
				if (arr.length == 1) {
					arr.push(true);
				}

				return arr;
			})
	);
}

//Location is the react-router location object
//Elements is a key/val pair of query values and their corresponding querySelector strings
//Timeout is an optional param
export function scrollToElement(location, elements) {
	//Ensure we have the required params, and check window to avoid SSR errors
	if (!location || !location.search || !elements || typeof window == "undefined") {
		return;
	}

	//Convert URL queries to key/value pairs
	const urlQueries = urlQueryHandler(location.search);

	//Get selector string
	const selectorString = elements[urlQueries.scrollTo];
	if (!selectorString) {
		return;
	}

	//Get selector element
	const element = document.querySelector(selectorString);
	if (!element) {
		return;
	}

	//Get element x position
	const { top } = element.getBoundingClientRect();

	//Get header height
	const headerHeight = document.querySelector("header").offsetHeight;

	window.scrollTo(0, top - headerHeight);
}

export function stringToProper(string, everyWord = false) {
	const fixSingleWord = str => str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();

	if (everyWord) {
		return string
			.split(" ")
			.map(fixSingleWord)
			.join(" ");
	} else {
		return fixSingleWord(string);
	}
}

export function arrayToList(originalArray) {
	// Clone array.
	const array = [...originalArray];

	if (array.length === 1) {
		return array[0];
	}

	const lastEntry = array.pop();

	return array.join(", ") + " & " + lastEntry;
}

export function getOrdinalNumber(num) {
	const numberAsString = num.toString();

	// 11, 12 and 13 use th.
	const isTens = numberAsString.length > 1 && numberAsString[numberAsString.length - 2] === "1";

	let suffix = "th";
	if (!isTens) {
		switch (numberAsString[numberAsString.length - 1]) {
			case "1":
				suffix = "st";
				break;
			case "2":
				suffix = "nd";
				break;
			case "3":
				suffix = "rd";
				break;
		}
	}

	return num.toLocaleString() + suffix;
}
