import mongoose from "mongoose";
const { Schema } = mongoose;

//Constants
const PlayerStatsCollectionSchema = require("./PlayerStatsCollection");
import gameEvents from "~/constants/gameEvents";

//Helpers
import getGameVirtuals from "./gameVirtuals";

//Schema
const gameSchema = new Schema(
	{
		//Basic Required Fields
		_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments", required: true },
		_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
		_opposition: { type: Schema.Types.ObjectId, ref: "teams", required: true },
		_teamType: {
			type: Schema.Types.ObjectId,
			ref: "teamTypes",
			required: true
		},
		date: { type: Date, required: true },
		isAway: { type: Boolean, required: true },
		slug: { type: String, unique: true, required: true },

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
		round: { type: Number, default: null },
		pregameSquads: {
			type: [
				{
					_team: { type: Schema.Types.ObjectId, ref: "people" },
					squad: [{ type: Schema.Types.ObjectId, ref: "people" }]
				}
			],
			default: []
		},
		tv: { type: String, enum: [false, "bbc", "sky"], default: null },
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
						ref: "socialProfiles",
						required: true
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
					stats: PlayerStatsCollectionSchema
				}
			],
			default: []
		},
		squadsAnnounced: { type: Boolean, default: false },

		//Man of the match
		_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_fan_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		fan_motm_link: { type: String, default: null },

		//Post-game fields
		attendance: { type: Number, default: null },
		extraTime: { type: Boolean, default: false },
		manOfSteel: {
			type: [
				{
					_player: { type: Schema.Types.ObjectId, ref: "people", default: null },
					points: { type: Number, enum: [1, 2, 3] }
				}
			],
			default: []
		},

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
				return ret;
			}
		},
		toObject: {
			virtuals: true
		}
	}
);

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

	const coreSlugText = `${teamSlug}${
		teamType.slug == "first" ? "-" : `-${teamType.slug}-`
	}${date.toString("yyyy-MM-dd")}`;

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
	return this.select("date _teamType slug _competition _opposition");
};

gameSchema.query.fullGame = function(forGamePage, forAdmin) {
	let model;

	//Select
	if (forAdmin) {
		model = this;
	} else {
		//Things to remove for gamepage
		let propsToRemove = ["events", "externalId", "externalSync", "extraTime"];

		//Things to remove for basics
		if (!forGamePage) {
			propsToRemove.push(
				"_referee",
				"_video_referee",
				"_motm",
				"_fan_motm",
				"fan_motm_link",
				"attendance",
				"manOfSteel"
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
			select: "name colours hashtagPrefix images"
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
			select:
				"name _parentCompetition appendCompetitionName instances instance type hashtagPrefix multipleInstances",
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
			select: "externalReportPage _parentCompetition instances multipleInstances",
			populate: {
				path: "_parentCompetition",
				select: "webcrawlUrl webcrawlFormat"
			}
		});
};

gameSchema.query.eventImage = function() {
	return this.select({
		hashtags: 1,
		customHashtags: 1,
		isAway: 1,
		date: 1,
		_ground: 1,
		_opposition: 1,
		_competition: 1,
		_teamType: 1,
		images: 1,
		round: 1,
		customTitle: 1,
		playerStats: 1,
		squadsAnnounced: 1,
		pregameSquads: 1,
		extraTime: 1,
		events: 1
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
			select: "name _parentCompetition instances instance hashtagPrefix multipleInstances",
			populate: {
				path: "_parentCompetition",
				select: "name useAllSquads"
			}
		})
		.populate({
			path: "_opposition",
			select: "images hashtagPrefix colours"
		});
};

mongoose.model("games", gameSchema);
