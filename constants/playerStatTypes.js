module.exports = {
	T: {
		singular: "Try",
		plural: "Tries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	CN: {
		singular: "Conversion",
		plural: "Conversions",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	PK: {
		singular: "Penalty Goal",
		plural: "Penalty Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	DG: {
		singular: "Drop Goal",
		plural: "Drop Goals",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	MG: {
		singular: "Missed Goal",
		plural: "Missed Goals",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Scoring",
		scoreOnly: true
	},
	G: {
		singular: "Goal",
		plural: "Goals",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	PT: {
		singular: "Point",
		plural: "Points",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: true
	},
	KS: {
		singular: "Kicking Success",
		plural: "Kicking Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false
	},
	TA: {
		singular: "Assist",
		plural: "Assists",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Scoring",
		scoreOnly: false
	},
	TB: {
		singular: "Tackle Bust",
		plural: "Tackle Busts",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	AT: {
		singular: "Attacking Kick",
		plural: "Attacking Kicks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	C: {
		singular: "Carry",
		plural: "Carries",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	M: {
		singular: "Metre",
		plural: "Metres",
		unit: "m",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	AG: {
		singular: "Average Gain",
		plural: "Average Gain",
		unit: "m",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	CB: {
		singular: "Clean Break",
		plural: "Clean Breaks",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	DR: {
		singular: "Dummy Run",
		plural: "Dummy Runs",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	E: {
		singular: "Error",
		plural: "Errors",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Attack",
		scoreOnly: false
	},
	FT: {
		singular: "40/20",
		plural: "40/20s",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	OF: {
		singular: "Offload",
		plural: "Offloads",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Attack",
		scoreOnly: false
	},
	TK: {
		singular: "Tackle",
		plural: "Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false
	},
	MI: {
		singular: "Missed Tackle",
		plural: "Missed Tackles",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false
	},
	TS: {
		singular: "Tackle Success",
		plural: "Tackle Success",
		unit: "%",
		storedInDatabase: false,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false
	},
	MT: {
		singular: "Marker Tackle",
		plural: "Marker Tackles",
		storedInDatabase: true,
		moreIsBetter: true,
		type: "Defence",
		scoreOnly: false
	},
	P: {
		singular: "Penalty",
		plural: "Penalties",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: false
	},
	YC: {
		singular: "Yellow Card",
		plural: "Yellow Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true
	},
	RC: {
		singular: "Red Card",
		plural: "Red Cards",
		storedInDatabase: true,
		moreIsBetter: false,
		type: "Defence",
		scoreOnly: true
	}
};
