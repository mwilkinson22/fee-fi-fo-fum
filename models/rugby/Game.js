import _ from "lodash";
import mongoose from "mongoose";
const { Schema } = mongoose;
const PlayerStatsCollectionSchema = require("./PlayerStatsCollection");

const gameSchema = new Schema(
	{
		_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments", required: true },
		_opposition: { type: Schema.Types.ObjectId, ref: "teams", required: true },
		isAway: { type: Boolean, required: true },
		date: { type: Date, required: true },
		pregameSquads: [
			{
				_team: { type: Schema.Types.ObjectId, ref: "people" },
				squad: [{ type: Schema.Types.ObjectId, ref: "people" }]
			}
		],
		playerStats: [
			{
				_player: { type: Schema.Types.ObjectId, ref: "people" },
				_team: { type: Schema.Types.ObjectId, ref: "teams" },
				position: Number,
				stats: PlayerStatsCollectionSchema
			}
		],
		round: { type: Number, default: null },
		_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
		customTitle: { type: String, default: null },
		customHashtags: [String],
		_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_fan_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		fan_motm_link: { type: String, default: null },
		_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_video_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		attendance: { type: Number, default: null },
		tv: { type: String, enum: [false, "bbc", "sky"], default: null },
		rflFixtureId: { type: Number, default: null },
		slug: { type: String, unique: true, required: true },
		_teamType: {
			type: Schema.Types.ObjectId,
			ref: "teamTypes",
			required: true
		},
		images: {
			header: String,
			midpage: String,
			logo: String
		}
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

gameSchema.statics.generateSlug = async function(opposition, date) {
	const Team = mongoose.models("teams");
	const team = await Team.findById(opposition);
	const coreSlugText = (team.name.short + " " + date)
		.replace(/\s/g, "-")
		.replace(/[^A-Za-z-]/gi, "")
		.toLowerCase();

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

gameSchema.query.getFixtures = function(fixtures) {
	const now = new Date();
	if (fixtures) {
		return this.where({ date: { $gt: now } });
	} else {
		return this.where({ date: { $lte: now } });
	}
};

gameSchema.query.fullGame = function() {
	return this.populate({
		path: "_opposition",
		select: "name colours hashtagPrefix image"
	})
		.populate({
			path: "_ground",
			populate: {
				path: "address._city"
			}
		})
		.populate({
			path: "_competition",
			select:
				"name _parentCompetition appendCompetitionName instances instance hashtagPrefix",
			populate: {
				path: "_parentCompetition",
				select: "name"
			}
		});
};

gameSchema.query.pregameImage = function() {
	return this.select(
		"hashtags customHashtags pregameSquads isAway date _ground _opposition _competition _teamType images"
	)
		.populate({ path: "pregameSquads.squad", select: "name image" })
		.populate({
			path: "_ground",
			select: "name address._city",
			populate: { path: "address._city", select: "name" }
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition instances instance hashtagPrefix",
			populate: {
				path: "_parentCompetition",
				select: "name"
			}
		})
		.populate({
			path: "_opposition",
			select: "hashtagPrefix"
		});
};

gameSchema.virtual("score").get(function() {
	if (!this.playerStats || !this.playerStats.length) {
		return undefined;
	} else {
		return _.chain(this.playerStats)
			.groupBy("_team")
			.mapValues(statSet => {
				const tries = _.sumBy(statSet, "stats.T");
				const conversions = _.sumBy(statSet, "stats.CN");
				const pens = _.sumBy(statSet, "stats.PK");
				const dropgoals = _.sumBy(statSet, "stats.DG");
				return tries * 4 + conversions * 2 + pens * 2 + dropgoals;
			})
			.value();
	}
});

gameSchema.virtual("status").get(function() {
	const { pregameSquads, playerStats } = this;
	if (!pregameSquads || pregameSquads.length < 2) {
		return 0;
	} else if (Object.keys(_.groupBy(playerStats, "_team")).length < 2) {
		return 1;
	} else if (!_.sumBy(playerStats, "stats.TK")) {
		return 2;
	} else {
		return 3;
	}
});

function getInstance(doc) {
	const { date, _competition } = doc;
	if (!_competition._parentCompetition) {
		return null; //Competition not populated
	}
	const year = new Date(date).getFullYear();

	const instance = _.chain(_competition.instances)
		.find(instance => instance.year === null || instance.year == year)
		.pick(["image", "specialRounds", "specialRounds", "sponsor"])
		.value();

	//Custom Title
	const { sponsor } = instance;
	const { _parentCompetition, appendCompetitionName, name } = _competition;
	const titleArr = [
		sponsor, //Sponsor
		_parentCompetition.name, //Parent comp i.e. Super League
		appendCompetitionName ? name : null //Segment name i.e. Super 8s
	];
	return {
		...instance,
		title: _.filter(titleArr, _.identity).join(" ")
	};
}

function getHashtags(doc) {
	const { _competition, customHashtags, _opposition, isAway } = doc;
	const hashtags = customHashtags || [];
	if (_opposition && _opposition.hashtagPrefix && _competition && _competition.hashtagPrefix) {
		let teamPrefixes = ["Hud", _opposition.hashtagPrefix];
		if (isAway) {
			teamPrefixes = teamPrefixes.reverse();
		}
		hashtags.push(_competition.hashtagPrefix + teamPrefixes.join(""));
	}
	return hashtags;
}

gameSchema.virtual("hashtags").get(function() {
	return getHashtags(this);
});

gameSchema.virtual("_competition.instance").get(function() {
	return getInstance(this);
});

gameSchema.virtual("title").get(function() {
	const { round, customTitle, _competition } = this;
	if (customTitle) {
		return customTitle;
	} else {
		const instance = getInstance(this);
		if (!instance) {
			return null;
		}

		const { specialRounds, title } = instance;

		let roundString = "";
		if (specialRounds) {
			const filteredRound = _.find(specialRounds, sr => sr.round == round);
			if (filteredRound) {
				roundString = " " + filteredRound.name;
			}
		}
		if (!roundString && round) {
			roundString = ` Round ${round}`;
		}

		return title + roundString;
	}
});

mongoose.model("games", gameSchema);
