import _ from "lodash";
import { localTeam } from "~/config/keys";

//Helper Functions
function getInstance(doc) {
	const { date, _competition } = doc;
	if (
		!date ||
		!_competition ||
		!_competition._parentCompetition ||
		!_competition.instances.length
	) {
		return null;
	}

	const year = new Date(date).getFullYear();
	const instance = _competition.instances.find(i => i.year == year);

	if (!instance) {
		return null;
	}

	const instanceFields = _.pick(instance, [
		"image",
		"specialRounds",
		"specialRounds",
		"sponsor",
		"manOfSteelPoints",
		"manOfSteelPointsGoneDark",
		"scoreOnly",
		"usesPregameSquads",
		"sharedSquads",
		"totalRounds",
		"leagueTableColours"
	]);

	//Custom Title
	const { sponsor } = instanceFields;
	const { basicTitle } = _competition;
	const titleArr = [
		sponsor, //Sponsor
		basicTitle //Basic Title (parent + segment names)
	];
	return {
		...instanceFields,
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

export function convertPlayerStatsToScore(playerStats) {
	return _.chain(playerStats)
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

//Apply Virtuals
export default gameSchema => {
	gameSchema.virtual("score").get(function() {
		if (!this.squadsAnnounced || !this.playerStats || !this.playerStats.length) {
			return undefined;
		} else {
			return convertPlayerStatsToScore(this.playerStats);
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

			if (
				usesPregameSquads &&
				(!pregameSquads || pregameSquads.filter(s => s.squad && s.squad.length).length < 2)
			) {
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
		const instance = getInstance(this);
		if (instance && instance.sharedSquads) {
			return _.chain(instance && instance.sharedSquads)
				.filter(({ _team }) => _team == localTeam || _team == _opposition._id.toString())
				.map(({ _team, sharedWith }) => [_team, sharedWith])
				.fromPairs()
				.value();
		}
	});

	//Get winner of player of the match
	gameSchema.virtual("fan_potm_winners").get(function() {
		const { fan_potm } = this;

		if (fan_potm && fan_potm.deadline && fan_potm.votes.length) {
			//Ensure voting has closed
			const votingClosed = new Date() > new Date(fan_potm.deadline);

			if (votingClosed) {
				const votes = _.chain(fan_potm.votes)
					.groupBy("choice")
					.map((votes, player) => ({ player, voteCount: votes.length }))
					.value();

				const maxVotes = _.chain(votes)
					.map("voteCount")
					.max()
					.value();

				return votes.filter(({ voteCount }) => voteCount === maxVotes).map(p => p.player);
			}
		}
	});

	//Check if the game is set to midnight, i.e. an unknown time
	gameSchema.virtual("hasTime").get(function() {
		if (!this.date) {
			return false;
		} else {
			return new Date(this.date).toString("H:mm") !== "0:00";
		}
	});
};
