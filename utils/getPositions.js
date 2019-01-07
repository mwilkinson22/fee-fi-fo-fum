const { positions } = require("../constants/playerPositions");
const _ = require("lodash");

module.exports = playerDetails => {
	const { mainPosition, otherPositions } = playerDetails;
	if (mainPosition) {
		playerDetails.mainPosition = positions[mainPosition].name;
	}
	if (otherPositions && otherPositions.length) {
		playerDetails.otherPositions = _.map(otherPositions, key => positions[key].name);
	}

	return playerDetails;
};
