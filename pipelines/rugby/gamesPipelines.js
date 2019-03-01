const _ = require("lodash");
const { localTeam } = require("../../config/keys");
const { ObjectId } = require("mongodb");

const projections = {};
projections.basic = {
	_id: 1,
	isAway: 1,
	date: 1,
	slug: 1,
	title: 1,
	customTitle: 1,
	_competition: 1,
	"_opposition._id": 1,
	"_opposition.colours": 1,
	"_opposition.name": 1,
	"_opposition.image": 1,
	"_ground.address._city": 1,
	"_ground.name": 1,
	"_ground.image": 1,
	playerStats: 1,
	images: 1,
	tv: 1,
	pregameSquads: 1
};

const getCompetitionInfo = [
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
					else: null
				}
			}
		}
	},
	{
		$addFields: {
			"_competition.image": {
				$cond: {
					if: "$_competition.instances.image",
					then: { $concat: ["$_competition.instances.image", " "] },
					else: null
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
							"$_competition._parentCompetition.name",
							" ",
							"$_competition.name"
						]
					},
					else: "$_competition._parentCompetition.name"
				}
			}
		}
	},
	{
		$addFields: {
			"_competition.name": {
				$cond: {
					if: "$_competition.sponsor",
					then: {
						$concat: ["$_competition.sponsor", " ", "$_competition.name"]
					},
					else: "$_competition.name"
				}
			}
		}
	}
];
const getBasicGameData = _.concat(
	//Get Competition Info
	getCompetitionInfo,
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
				customTitle: "$title",
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

const getFullGame = _.concat(getBasicGameData, [
	{
		$addFields: {
			teams: {
				home: {
					$cond: {
						if: "$isAway",
						then: "$_opposition._id",
						else: ObjectId(localTeam)
					}
				},
				away: {
					$cond: {
						if: "$isAway",
						then: ObjectId(localTeam),
						else: "$_opposition._id"
					}
				}
			}
		}
	},
	{
		$lookup: {
			from: "teams",
			localField: "teams.home",
			foreignField: "_id",
			as: "teams.home"
		}
	},
	{
		$lookup: {
			from: "teams",
			localField: "teams.away",
			foreignField: "_id",
			as: "teams.away"
		}
	},
	{
		$unwind: "$teams.home"
	},
	{
		$unwind: "$teams.away"
	}
]);

module.exports = {
	projections,
	getCompetitionInfo,
	getBasicGameData,
	getFullGame
};
