const _ = require("lodash");
const mongoose = require("mongoose");
const { localTeam } = require("../../config/keys");
const Game = mongoose.model("games");
const ObjectId = mongoose.Types.ObjectId;

function buildQuery(params) {
	const query = {};
	if (params.year) {
		//Only fired for "results"
		const year = Number(params.year);
		const now = new Date();
		const endOfYear = new Date(`${year + 1}-01-01`);
		const latestDate = now < endOfYear ? now : endOfYear;
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: latestDate
		};
	}

	if (params.opposition) {
		query._opposition = ObjectId(params.opposition);
	}

	if (params.venue) {
		query.isAway = params.venue === "a";
	}

	if (params.competitions) {
		query._competition = ObjectId(params.competitions);
	}

	return query;
}

const pipelines = {};
pipelines.competitionInfo = [
	{
		$lookup: {
			from: "competitionsegments",
			localField: "_competition",
			foreignField: "_id",
			as: "_competition"
		}
	},
	{
		$unwind: "$_competition"
	},
	{
		$lookup: {
			from: "competitions",
			localField: "_competition._parentCompetition",
			foreignField: "_id",
			as: "_competition._parentCompetition"
		}
	},
	{
		$unwind: "$_competition._parentCompetition"
	},
	{
		$addFields: {
			year: {
				$year: "$date"
			}
		}
	},
	{
		$addFields: {
			"_competition.instances": {
				$filter: {
					input: "$_competition.instances",
					as: "instance",
					cond: {
						$or: [
							{ $eq: ["$$instance.year", "$year"] },
							{ $eq: ["$$instance.year", null] }
						]
					}
				}
			}
		}
	},
	{
		$unwind: "$_competition.instances"
	},
	{
		$addFields: {
			"_competition.sponsor": {
				$cond: {
					if: "$_competition.instances.sponsor",
					then: { $concat: ["$_competition.instances.sponsor", " "] },
					else: ""
				}
			}
		}
	},
	{
		$addFields: {
			"_competition.name": {
				$cond: {
					if: "$_competition.appendCompetitionName",
					then: {
						$concat: [
							"$_competition.sponsor",
							"$_competition._parentCompetition.name",
							" ",
							"$_competition.name"
						]
					},
					else: {
						$concat: ["$_competition.sponsor", "$_competition._parentCompetition.name"]
					}
				}
			}
		}
	}
];
pipelines.gameData = _.concat(
	//Get Competition Info
	pipelines.competitionInfo,
	[
		//Get Team Info
		{
			$lookup: {
				from: "teams",
				localField: "_opposition",
				foreignField: "_id",
				as: "_opposition"
			}
		},
		{
			$unwind: "$_opposition"
		},
		{
			$addFields: {
				teams: {
					home: {
						$cond: {
							if: "$isAway",
							then: "$_opposition._id",
							else: localTeam
						}
					},
					away: {
						$cond: {
							if: "$isAway",
							then: localTeam,
							else: "$_opposition._id"
						}
					}
				}
			}
		},

		//Get Ground Info
		{
			$lookup: {
				from: "grounds",
				localField: "_ground",
				foreignField: "_id",
				as: "_ground"
			}
		},
		{
			$unwind: "$_ground"
		},
		{
			$lookup: {
				from: "cities",
				localField: "_ground.address._city",
				foreignField: "_id",
				as: "_ground.address._city"
			}
		},
		{
			$unwind: "$_ground.address._city"
		},
		{
			$addFields: {
				title: {
					$cond: {
						if: {
							$ne: ["$title", null]
						},
						then: "$title",
						else: {
							$cond: {
								if: {
									$eq: ["$round", null]
								},
								then: "$_competition.name",
								else: {
									$concat: [
										"$_competition.name",
										" Round ",
										{ $toLower: "$round" } //TODO Add special rounds
									]
								}
							}
						}
					}
				}
			}
		}
	]
);
pipelines.basicInfoOnly = [
	{
		$project: {
			_id: 1,
			isAway: 1,
			date: 1,
			slug: 1,
			title: 1,
			"_opposition.colours": 1,
			"_opposition.name": 1,
			"_opposition.image": 1,
			"_ground.address._city": 1,
			"_ground.name": 1,
			"_ground.image": 1
		}
	}
];

module.exports = {
	async getFixtures(req, res) {
		const query = {
			date: { $gt: new Date() },
			...buildQuery(req.query)
		};

		const games = await Game.aggregate(
			_.concat(
				[
					{ $match: query },
					{
						$sort: {
							date: 1
						}
					}
				],
				pipelines.gameData,
				pipelines.basicInfoOnly
			)
		);
		res.send(games);
	},

	async getResults(req, res) {
		const { year } = req.params;
		const query = buildQuery({ ...req.query, year });
		const games = await Game.aggregate(
			_.concat(
				[
					{ $match: query },
					{
						$sort: {
							date: -1
						}
					}
				],
				pipelines.gameData,
				pipelines.basicInfoOnly
			)
		);
		res.send(games);
	},

	async getYearsWithResults(req, res) {
		const years = await Game.aggregate([
			{ $sort: { date: 1 } },
			{ $match: { date: { $lt: new Date() } } },
			{ $group: { _id: { $year: "$date" } } }
		]);
		res.send(years.map(year => year._id));
	},

	async getFilters(req, res) {
		const { year } = req.params;

		//Create query
		const query = {};
		if (year === "fixtures") {
			query.date = {
				$gte: new Date()
			};
		} else {
			query.date = {
				$gte: new Date(year + "-01-01"),
				$lt: new Date(Number(year) + 1 + "-01-01")
			};
		}

		//Get competitions
		const competitions = await Game.aggregate(
			_.concat(
				[{ $match: query }],
				pipelines.competitionInfo,

				[
					{
						$group: {
							_id: "$_competition._id",
							name: { $first: "$_competition.name" }
						}
					},
					{
						$sort: {
							name: 1
						}
					}
				]
			)
		);

		//Get Opposition
		const opposition = await Game.aggregate([
			{ $match: query },
			{
				$lookup: {
					from: "teams",
					localField: "_opposition",
					foreignField: "_id",
					as: "_opposition"
				}
			},
			{ $group: { _id: "$_opposition._id", name: { $first: "$_opposition.name.long" } } },
			{ $sort: { name: 1 } }
		]);

		const venue = await Game.aggregate([
			{ $match: query },
			{
				$project: {
					_id: {
						$cond: {
							if: "$isAway",
							then: "a",
							else: "h"
						}
					},
					name: {
						$cond: {
							if: "$isAway",
							then: "Away",
							else: "Home"
						}
					}
				}
			},
			{
				$group: { _id: "$_id", name: { $first: "$name" } }
			},
			{
				$sort: {
					name: -1
				}
			}
		]);
		res.send({
			competitions,
			opposition,
			venue
		});
	}
};
