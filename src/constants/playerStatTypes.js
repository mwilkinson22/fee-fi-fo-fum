module.exports = {
	T: {
		singular: "Try",
		plural: "Tries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: 2,
		isAverage: false
	},
	TA: {
		singular: "Assist",
		plural: "Assists",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false,
		requiredForGameStar: 2,
		isAverage: false
	},
	CN: {
		singular: "Conversion",
		plural: "Conversions",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	PK: {
		singular: "Penalty Goal",
		plural: "Penalty Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	DG: {
		singular: "Drop Goal",
		plural: "Drop Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	MG: {
		singular: "Missed Goal",
		plural: "Missed Goals",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	G: {
		singular: "Goal",
		plural: "Goals",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	KS: {
		singular: "Kicking Success",
		plural: "Kicking Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false,
		requiredForGameStar: 100,
		isAverage: true
	},
	PT: {
		singular: "Point",
		plural: "Points",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	M: {
		singular: "Metre",
		plural: "Metres",
		unit: "m",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 100,
		isAverage: false
	},
	C: {
		singular: "Carry",
		plural: "Carries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 15,
		isAverage: false
	},
	AG: {
		singular: "Average Gain",
		plural: "Average Gain",
		unit: "m",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 10,
		isAverage: true
	},
	TB: {
		singular: "Tackle Bust",
		plural: "Tackle Busts",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 4,
		isAverage: false
	},
	CB: {
		singular: "Clean Break",
		plural: "Clean Breaks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 2,
		isAverage: false
	},
	OF: {
		singular: "Offload",
		plural: "Offloads",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 3,
		isAverage: false
	},
	KGP: {
		singular: "Kick In General Play",
		plural: "Kicks In General Play",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: null,
		isAverage: false
	},
	AT: {
		singular: "Attacking Kick",
		plural: "Attacking Kicks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: null,
		isAverage: false
	},
	DR: {
		singular: "Dummy Run",
		plural: "Dummy Runs",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 10,
		isAverage: false
	},
	FT: {
		singular: "40/20",
		plural: "40/20s",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 1,
		isAverage: false
	},
	TF: {
		singular: "20/40",
		plural: "20/40s",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 1,
		isAverage: false
	},
	E: {
		singular: "Error",
		plural: "Errors",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: null,
		isAverage: false
	},
	TK: {
		singular: "Tackle",
		plural: "Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 30,
		isAverage: false
	},
	MT: {
		singular: "Marker Tackle",
		plural: "Marker Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 10,
		isAverage: false
	},
	MI: {
		singular: "Missed Tackle",
		plural: "Missed Tackles",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: null,
		isAverage: false
	},
	TS: {
		singular: "Tackle Success",
		plural: "Tackle Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 96.5,
		isAverage: true
	},
	P: {
		singular: "Penalty",
		plural: "Penalties",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: null,
		isAverage: false
	},
	YC: {
		singular: "Yellow Card",
		plural: "Yellow Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	},
	RC: {
		singular: "Red Card",
		plural: "Red Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true,
		requiredForGameStar: null,
		isAverage: false
	}
};
