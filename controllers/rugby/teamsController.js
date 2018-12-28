const _ = require("lodash");
const mongoose = require("mongoose");
const Team = mongoose.model("teams");
const { ObjectId } = require("mongodb");
const { localTeam } = require("../../config/keys");

function buildQuery(params) {
	const query = {};

	return query;
}

function validateTeam(team) {
	if (team === "local") {
		return ObjectId(localTeam);
	} else if (ObjectId.isValid(team)) {
		return ObjectId(team);
	} else {
		return false;
	}
}

module.exports = {
	async getYearsWithSquads(req, res) {
		const team = validateTeam(req.params.team);
		if (team) {
			const years = await Team.aggregate([
				{
					$match: {
						_id: team
					}
				},
				{
					$unwind: "$squads"
				},
				{
					$group: {
						_id: "$squads.year"
					}
				},
				{
					$sort: {
						_id: -1
					}
				}
			]);

			res.send(years.map(year => year._id));
		} else {
			res.status(404).send("Invalid team Id");
		}
	},
	async getSquadByYear(req, res) {
		const team = validateTeam(req.params.team);

		if (team) {
			let { includeFriendlyOnly } = req.query;

			const results = await Team.aggregate([
				{
					$match: {
						_id: team
					}
				},
				{
					$project: {
						squad: {
							$filter: {
								input: "$squads",
								as: "squad",
								cond: { $eq: [{ $toLower: "$$squad.year" }, req.params.year] }
							}
						}
					}
				},
				{
					$unwind: "$squad"
				},
				{
					$addFields: {
						squad: {
							players: {
								$filter: {
									input: "$squad.players",
									as: "player",
									cond: {
										$or: [
											{ $eq: ["$$player.friendlyOnly", false] },
											{ $ne: [includeFriendlyOnly, undefined] }
										]
									}
								}
							}
						}
					}
				},
				{
					$unwind: "$squad.players"
				},
				{
					$sort: {
						"squad.players.number": 1
					}
				},
				{
					$lookup: {
						from: "people",
						localField: "squad.players._player",
						foreignField: "_id",
						as: "squad.players._player"
					}
				},
				{
					$replaceRoot: { newRoot: "$squad" }
				},
				{
					$group: {
						_id: "$year",
						players: { $push: "$players" }
					}
				},
				{
					$project: {
						players: {
							number: 1,
							_player: {
								_id: 1,
								name: 1,
								mainPosition: 1,
								otherPositions: 1,
								slug: 1
							}
						}
					}
				}
			]);
			const year = results[0]._id;
			const players = _.mapValues(results[0].players, player => {
				const { number } = player;
				return { number, ...player._player[0] };
			});
			res.send({ year, players });
		} else {
			res.status(404).send("Invalid team Id");
		}
	}
};
