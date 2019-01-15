const _ = require("lodash");
const mongoose = require("mongoose");
const Person = mongoose.model("people");
const Game = mongoose.model("games");
const { ObjectId } = require("mongodb");
const { earliestGiantsData } = require("../../config/keys");
const { getBasicGameData } = require("../../pipelines/rugby/gamesPipelines");
const { localTeam } = require("../../config/keys");

module.exports = {
	async getPlayerStatsYears(req, res) {
		//Date Query
		const { id } = req.params;
		const now = new Date();
		const date = {
			$gte: new Date(`${earliestGiantsData}-01-01`),
			$lt: now
		};

		//Slug
		const Player = await Person.findById(id, "slug");
		const { slug } = Player;

		const years = await Game.aggregate([
			{
				$match: {
					date,
					playerStats: {
						$elemMatch: {
							_team: ObjectId(localTeam),
							_player: ObjectId(id)
						}
					}
				}
			},
			{
				$group: {
					_id: {
						$year: "$date"
					}
				}
			},
			{
				$sort: {
					_id: -1
				}
			}
		]);

		res.send({ slug, years: years.map(obj => obj._id) });
	},
	async getPlayerStatsByYear(req, res) {
		const Game = mongoose.model("games");
		const { id, year } = req.params;
		const Player = await Person.findById(id, "slug");
		const { slug } = Player;

		//Create Date Query
		const now = new Date();
		const endOfYear = new Date(`${Number(year) + 1}-01-01`);
		const latestDate = now < endOfYear ? now : endOfYear;
		const date = {
			$gte: new Date(`${year}-01-01`),
			$lt: latestDate
		};

		const games = await Game.aggregate(
			_.concat(
				[
					{
						$match: {
							date,
							playerStats: {
								$elemMatch: {
									_team: ObjectId(localTeam),
									_player: ObjectId(id)
								}
							}
						}
					},
					{
						$sort: {
							date: 1
						}
					}
				],
				getBasicGameData,
				[
					{
						$project: {
							date: 1,
							_opposition: 1,
							_competition: 1,
							isAway: 1,
							motm: 1,
							fan_motm: 1,
							slug: 1,
							title: 1,
							playerStats: {
								$filter: {
									input: "$playerStats",
									as: "playerStat",
									cond: {
										$and: [
											{ $eq: ["$$playerStat._team", ObjectId(localTeam)] },
											{ $eq: ["$$playerStat._player", ObjectId(id)] }
										]
									}
								}
							}
						}
					}
				]
			)
		);
		res.send({ slug, year, games });
	}
};
