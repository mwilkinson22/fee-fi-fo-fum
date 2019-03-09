const _ = require("lodash");
const mongoose = require("mongoose");
const Team = mongoose.model("teams");
const { ObjectId } = require("mongodb");
const getPositions = require("../../utils/getPositions");
const Colour = require("color");

function validateTeam(team) {
	if (ObjectId.isValid(team)) {
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
					$lookup: {
						from: "teamtypes",
						localField: "squads._teamType",
						foreignField: "_id",
						as: "squads._teamType"
					}
				},
				{
					$group: {
						_id: "$squads.year",
						teamTypes: { $push: "$squads._teamType" }
					}
				},
				{
					$unwind: "$teamTypes"
				},
				{
					$sort: {
						_id: -1
					}
				}
			]);
			const result = _.chain(years)
				.map(val => [val._id, val.teamTypes.map(t => t.slug)])
				.fromPairs()
				.value();
			res.send(result);
		} else {
			res.status(404).send("Invalid team Id");
		}
	},
	async getAll(req, res) {
		const teams = await Team.find({}, { squads: false });
		res.send(teams);
	},
	async getSquadByYear(req, res) {
		const team = validateTeam(req.params.team);
		const { year, teamType } = req.params;

		if (team) {
			let { includeFriendlyOnly } = req.query;

			const aggregation = await Team.aggregate([
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
								cond: {
									$and: [
										{ $eq: [{ $toLower: "$$squad.year" }, year] },
										{
											$eq: [
												"$$squad._teamType",
												ObjectId("5c34e00a0838a5b090f8c1a7")
											]
										}
									]
								}
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
								image: 1,
								playerDetails: 1,
								slug: 1
							}
						}
					}
				}
			]);

			if (aggregation.length) {
				const results = _.sortBy(aggregation[0].players, player => player.number || 1000); //If number === null, we push it to the end
				const players = _.map(results, wrapper => {
					const { number } = wrapper;
					const player = wrapper._player[0];
					player.playerDetails = getPositions(player.playerDetails);
					return { number, ...player };
				});
				res.send(players);
			} else {
				res.send([]);
			}
		} else {
			res.status(404).send("Invalid team Id");
		}
	},
	async update(req, res) {
		const { _id } = req.params;
		const team = await Team.findById(_id);
		if (!team) {
			res.status(500).send(`No team with id ${_id} was found`);
		} else {
			//Handle Plain Text Fields
			const values = _.mapValues(req.body, (val, key) => {
				switch (key) {
					case "_ground":
						return val.value;
					case "colours":
						if (!val.customPitchColour) {
							val.pitchColour = null;
						}
						if (!val.customStatBarColour) {
							val.statBarColour = null;
						}
						return _.mapValues(val, colour => {
							if (typeof colour === "string") {
								return Colour(colour)
									.rgb()
									.array();
							} else {
								return colour;
							}
						});
					default:
						return val;
				}
			});
			await Team.updateOne({ _id }, values);
			const updatedTeam = await Team.findById(_id);
			res.send(updatedTeam);
		}
	}
};
