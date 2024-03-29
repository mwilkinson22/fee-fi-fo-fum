import mongoose from "mongoose";
const { Schema } = mongoose;

//Constants
const PlayerStatsCollectionSchema = require("./PlayerStatsCollection");
import gameEvents from "~/constants/gameEvents";
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import getGameVirtuals from "./gameVirtuals";
const { mongooseDebug } = require("~/middlewares/mongooseDebug");

//Schema
const gameSchema = new Schema(
	{
		//Basic Required Fields
		_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments", required: true },
		_ground: { type: Schema.Types.ObjectId, ref: "grounds" },
		_opposition: { type: Schema.Types.ObjectId, ref: "teams", required: true },
		_teamType: {
			type: Schema.Types.ObjectId,
			ref: "teamTypes",
			required: true
		},
		dateRange: { type: Number, default: null },
		date: { type: Date, required: true },
		isAway: { type: Boolean, required: true },
		isNeutralGround: { type: Boolean, required: true, default: false },
		slug: { type: String, unique: true, required: true },
		hideGame: { type: Boolean, default: false },

		//Pre-game fields
		_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_video_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		customHashtags: { type: [String], default: [] },
		images: {
			type: {
				header: String,
				midpage: String,
				customLogo: String
			},
			default: {
				header: null,
				midpage: null,
				customLogo: null
			}
		},
		customTitle: { type: String, default: null },
		externalId: { type: Number, default: null },
		externalSync: { type: Boolean, default: false },
		excludeFromAdminDashboard: { type: Boolean, default: false },
		round: { type: Number, default: null },
		pregameSquads: {
			type: [
				{
					_team: { type: Schema.Types.ObjectId, ref: "teams" },
					squad: [{ type: Schema.Types.ObjectId, ref: "people" }]
				}
			],
			default: []
		},
		_broadcaster: { type: Schema.Types.ObjectId, ref: "broadcasters", default: null },
		socialImageVersion: { type: Number, default: 1 },

		//Game Day Fields
		events: {
			type: [
				{
					event: {
						type: String,
						required: true,
						enum: Object.keys(gameEvents)
					},
					_player: { type: Schema.Types.ObjectId, ref: "people", default: null },
					date: { type: Date, default: Date.now },
					tweet_id: { type: String, default: null },
					tweet_text: { type: String, default: null },
					tweet_image: { type: String, default: null },
					inDatabase: { type: Boolean, default: false },
					_profile: {
						type: Schema.Types.ObjectId,
						ref: "socialProfiles"
					},
					_user: { type: Schema.Types.ObjectId, ref: "users", required: true }
				}
			],
			default: []
		},
		playerStats: {
			type: [
				{
					_player: { type: Schema.Types.ObjectId, ref: "people" },
					_team: { type: Schema.Types.ObjectId, ref: "teams" },
					position: Number,
					stats: PlayerStatsCollectionSchema,
					isExtraInterchange: { type: Boolean, default: false }
				}
			],
			default: []
		},
		squadsAnnounced: { type: Boolean, default: false },
		_kickers: [
			{
				_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
				_player: { type: Schema.Types.ObjectId, ref: "people", required: true }
			}
		],

		//Man of the match
		_potm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		fan_potm: {
			options: [{ type: Schema.Types.ObjectId, ref: "people", default: null }],
			deadline: { type: Date, default: null },
			votes: {
				type: [
					{
						ip: { type: String, required: true },
						choice: { type: Schema.Types.ObjectId, ref: "people" },
						session: { type: String, required: true }
					}
				],
				default: []
			}
		},

		//Post-game fields
		attendance: { type: Number, default: null },
		extraTime: { type: Boolean, default: false },
		overrideGameStarStats: [
			{
				_player: { type: Schema.Types.ObjectId, ref: "people" },
				stats: [{ type: String, enum: Object.keys(playerStatTypes) }]
			}
		],
		manOfSteel: {
			type: [
				{
					_player: { type: Schema.Types.ObjectId, ref: "people", default: null },
					points: { type: Number, enum: [1, 2, 3] }
				}
			],
			default: []
		},
		scoreOnly: { type: Boolean, default: false },

		//Temporary score override where squads/details are unavailable
		scoreOverride: [
			{
				_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
				points: { type: Number, required: true }
			}
		]
	},
	{
		toJSON: {
			virtuals: true,
			transform: function(doc, ret) {
				delete ret._competition.instances;
				if (ret.playerStats) {
					ret.playerStats.forEach(({ stats }) => delete stats._id);
				}
				return ret;
			}
		},
		toObject: {
			virtuals: true
		}
	}
);

//Middleware
mongooseDebug(gameSchema);

//Virtuals
getGameVirtuals(gameSchema);

//Methods
gameSchema.statics.generateSlug = async function({ _opposition, date, _teamType }) {
	//Get Team
	const Team = mongoose.model("teams");
	const team = await Team.findById(_opposition, "name.short");
	const teamSlug = team.name.short
		.toLowerCase()
		.replace(/\s+/gi, "-")
		.replace(/[^-a-z]/gi, "");

	//Get Team Type
	const TeamType = mongoose.model("teamTypes");
	const teamType = await TeamType.findById(_teamType, "slug");

	//Ensure date is date object
	if (typeof date === "string") {
		date = new Date(date);
	}

	const coreSlugText = `${teamSlug}${teamType.slug == "first" ? "-" : `-${teamType.slug}-`}${date.toString(
		"yyyy-MM-dd"
	)}`;

	let slugExists = await this.findOne({
		slug: coreSlugText
	});

	if (!slugExists) {
		return coreSlugText;
	} else {
		let i = 2;
		let slug;
		while (slugExists) {
			slug = coreSlugText + "-" + i++;
			slugExists = await this.findOne({
				slug
			});
		}

		return slug;
	}
};

//Queries
gameSchema.query.forList = function() {
	return this.select("date _teamType slug _competition _opposition dateRange isAway");
};

gameSchema.query.fullGame = function(forGamePage, forAdmin) {
	let model;

	//Select
	if (forAdmin) {
		model = this;
	} else {
		//Things to remove for all non-admin loads
		let propsToRemove = [
			"events",
			"externalId",
			"externalSync",
			"extraTime",
			"_kickers",
			"excludeFromAdminDashboard"
		];

		//Things to remove for basics
		if (!forGamePage) {
			propsToRemove.push(
				"_referee",
				"_video_referee",
				"playerStats._id",
				//"pregameSquads", - we need pregameSquads to calculate status. So we load it here, then remove it before returning to server
				"overrideGameStarStats"
			);
		}

		//Get required fields
		model = this.select(propsToRemove.map(p => `-${p}`).join(" "));
	}

	//Populate
	if (forAdmin) {
		model = model
			.populate({
				path: "events._profile",
				select: "name"
			})
			.populate({
				path: "events._user",
				select: "username"
			});
	}

	if (forGamePage) {
		model = model
			.populate({
				path: "_referee",
				select: "name"
			})
			.populate({
				path: "_video_referee",
				select: "name"
			});
	}

	return model
		.populate({
			path: "_opposition",
			select: "name colours hashtagPrefix images previousIdentities"
		})
		.populate({
			path: "_broadcaster"
		})
		.populate({
			path: "_ground",
			populate: {
				path: "address._city",
				select: "name _country",
				populate: {
					path: "_country",
					select: "name"
				}
			}
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition appendCompetitionName basicTitle instances instance type hashtagPrefix",
			populate: {
				path: "_parentCompetition",
				select: "name useAllSquads interchangeLimit"
			}
		});
};

gameSchema.query.crawl = function() {
	return this.select("externalId _competition playerStats date isAway _opposition")
		.populate({
			path: "playerStats._player",
			select: "name externalName"
		})
		.populate({
			path: "_competition",
			select: "_parentCompetition instances",
			populate: {
				path: "_parentCompetition",
				select: "webcrawlFormat"
			}
		});
};

gameSchema.query.eventImage = function() {
	return this.select({
		slug: 0,
		_referee: 0,
		_video_referee: 0,
		externalId: 0,
		externalSync: 0,
		socialImageVersion: 0,
		attendance: 0
	})
		.populate({ path: "pregameSquads.squad", select: "name images gender" })
		.populate({
			path: "playerStats._player",
			select: "name nickname displayNicknameInCanvases squadNameWhenDuplicate images gender"
		})
		.populate({
			path: "_ground",
			select: "name address._city image",
			populate: { path: "address._city", select: "name" }
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition instances instance hashtagPrefix",
			populate: {
				path: "_parentCompetition",
				select: "name useAllSquads interchangeLimit"
			}
		})
		.populate({
			path: "_opposition",
			select: "images hashtagPrefix colours previousIdentities name"
		});
};

mongoose.model("games", gameSchema);
