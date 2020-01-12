import _ from "lodash";
import { localTeam } from "~/config/keys";

//Helper Functions
function getInstance(doc) {
	const { date, _competition } = doc;
	if (
		!date ||
		!_competition ||
		!_competition._parentCompetition ||
		_competition.multipleInstances == null ||
		!_competition.instances.length
	) {
		return null;
	}

	let instance;
	if (_competition.multipleInstances) {
		const year = new Date(date).getFullYear();
		instance = _competition.instances.find(i => i.year == year);
	} else {
		instance = _competition.instances[0];
	}

	if (!instance) {
		return null;
	}

	instance = _.pick(instance, [
		"image",
		"specialRounds",
		"specialRounds",
		"sponsor",
		"manOfSteelPoints",
		"scoreOnly",
		"usesPregameSquads",
		"sharedSquads"
	]);

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
	const hashtags = _.clone(customHashtags) || [];
	if (_opposition && _opposition.hashtagPrefix && _competition && _competition.hashtagPrefix) {
		let teamPrefixes = ["Hud", _opposition.hashtagPrefix];
		if (isAway) {
			teamPrefixes = teamPrefixes.reverse();
		}
		hashtags.push(_competition.hashtagPrefix + teamPrefixes.join(""));
	}
	return hashtags;
}

//Apply Virtuals
export default gameSchema => {
	gameSchema.virtual("score").get(function() {
		if (!this.squadsAnnounced || !this.playerStats || !this.playerStats.length) {
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

	gameSchema.virtual("hashtags").get(function() {
		return getHashtags(this);
	});

	gameSchema.virtual("_competition.instance").get(function() {
		return getInstance(this);
	});

	gameSchema.virtual("images.logo").get(function() {
		const { images } = this;
		if (!images) {
			return null;
		}

		if (images.customLogo) {
			return `images/games/logo/${images.customLogo}`;
		}

		const instance = getInstance(this);
		if (instance && instance.image) {
			return `images/competitions/${instance.image}`;
		}

		return null;
	});

	gameSchema.virtual("title").get(function() {
		const { round, customTitle } = this;
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

	gameSchema.virtual("status").get(function() {
		const { pregameSquads, playerStats, squadsAnnounced } = this;
		const instance = getInstance(this);
		if (instance) {
			const { usesPregameSquads } = instance;

			if (usesPregameSquads && (!pregameSquads || pregameSquads.length < 2)) {
				return 0;
			} else if (
				Object.keys(_.groupBy(playerStats, "_team")).length < 2 ||
				!squadsAnnounced
			) {
				return 1;
			} else if (!instance.scoreOnly && !_.sumBy(playerStats, "stats.TK")) {
				return 2;
			} else {
				return 3;
			}
		} else {
			return null;
		}
	});

	//Get Shared Squads
	gameSchema.virtual("sharedSquads").get(function() {
		const { _opposition } = this;
		const { sharedSquads } = getInstance(this);

		if (sharedSquads) {
			return _.chain(sharedSquads)
				.filter(({ _team }) => _team == localTeam || _team == _opposition._id)
				.map(({ _team, sharedWith }) => [_team, sharedWith])
				.fromPairs()
				.value();
		}
	});
};
