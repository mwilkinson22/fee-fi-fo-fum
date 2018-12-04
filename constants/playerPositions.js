const _ = require("lodash");

const PlayerPositions = {
	positions: {
		FB: {
			name: "Fullback",
			type: "Back",
			numbers: [1]
		},
		W: {
			name: "Winger",
			type: "Back",
			numbers: [2, 5]
		},
		C: {
			name: "Center",
			type: "Back",
			numbers: [3, 4]
		},
		SO: {
			name: "Stand Off",
			type: "Back",
			numbers: [6]
		},
		SH: {
			name: "Scrum Half",
			type: "Back",
			numbers: [7]
		},
		P: {
			name: "Prop",
			type: "Forward",
			numbers: [8, 10]
		},
		H: {
			name: "Hooker",
			type: "Forward",
			numbers: [9]
		},
		SR: {
			name: "Second Row",
			type: "Forward",
			numbers: [11, 12]
		},
		LF: {
			name: "Loose Forward",
			type: "Forward",
			numbers: [13]
		},
		I: {
			name: "Interchange",
			type: "Interchange",
			numbers: [14, 15, 16, 17]
		}
	}
};
PlayerPositions.positionKeys = _.keys(PlayerPositions.positions);
module.exports = PlayerPositions;
