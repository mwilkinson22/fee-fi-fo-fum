module.exports = {
	T: {
		singular: "Try",
		plural: "Tries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: 2
	},
	CN: {
		singular: "Conversion",
		plural: "Conversions",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	PK: {
		singular: "Penalty Goal",
		plural: "Penalty Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	DG: {
		singular: "Drop Goal",
		plural: "Drop Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	MG: {
		singular: "Missed Goal",
		plural: "Missed Goals",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	G: {
		singular: "Goal",
		plural: "Goals",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	PT: {
		singular: "Point",
		plural: "Points",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true,
		requiredForGameStar: null
	},
	KS: {
		singular: "Kicking Success",
		plural: "Kicking Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false,
		requiredForGameStar: 100
	},
	TA: {
		singular: "Assist",
		plural: "Assists",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false,
		requiredForGameStar: 2
	},
	TB: {
		singular: "Tackle Bust",
		plural: "Tackle Busts",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 3
	},
	AT: {
		singular: "Attacking Kick",
		plural: "Attacking Kicks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: null
	},
	C: {
		singular: "Carry",
		plural: "Carries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 15
	},
	M: {
		singular: "Metre",
		plural: "Metres",
		unit: "m",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 100
	},
	AG: {
		singular: "Average Gain",
		plural: "Average Gain",
		unit: "m",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 10
	},
	CB: {
		singular: "Clean Break",
		plural: "Clean Breaks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 2
	},
	DR: {
		singular: "Dummy Run",
		plural: "Dummy Runs",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 10
	},
	E: {
		singular: "Error",
		plural: "Errors",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: null
	},
	FT: {
		singular: "40/20",
		plural: "40/20s",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 1
	},
	OF: {
		singular: "Offload",
		plural: "Offloads",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false,
		requiredForGameStar: 3
	},
	TK: {
		singular: "Tackle",
		plural: "Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 30
	},
	MI: {
		singular: "Missed Tackle",
		plural: "Missed Tackles",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: null
	},
	TS: {
		singular: "Tackle Success",
		plural: "Tackle Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 96.5
	},
	MT: {
		singular: "Marker Tackle",
		plural: "Marker Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: 10
	},
	P: {
		singular: "Penalty",
		plural: "Penalties",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false,
		requiredForGameStar: null
	},
	YC: {
		singular: "Yellow Card",
		plural: "Yellow Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true,
		requiredForGameStar: null
	},
	RC: {
		singular: "Red Card",
		plural: "Red Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true,
		requiredForGameStar: null
	}
};
