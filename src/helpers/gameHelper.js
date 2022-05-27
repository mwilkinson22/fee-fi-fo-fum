//Modules
import _ from "lodash";
import { parse } from "node-html-parser";
import axios from "axios";
import https from "https";

//Helpers
import { calculateAdditionalStats, statToString } from "~/helpers/statsHelper";

//Constants
const playerStatTypes = require("~/constants/playerStatTypes");
import webcrawlData from "~/constants/webcrawlData";
import { localTeam } from "~/config/keys";
import { applyPreviousIdentity } from "~/helpers/teamHelper";

export function validateGameDate(game, listType, year = null) {
	const now = new Date();

	if (listType === "results" && year) {
		return game.date <= now && game.date.getFullYear() == year;
	} else if (listType === "results") {
		return game.date <= now;
	} else {
		return game.date > now;
	}
}

export function fixDates(games) {
	return _.mapValues(games, game => {
		if (game) {
			game.date = new Date(game.date);
		}
		return game;
	});
}

export function fixLocalGames(games, localTeam) {
	return _.mapValues(fixDates(games), game => {
		// We've had an error on 2022-05-27, in which game was a valid object but it had no date.
		// Can't reproduce and it really makes no sense, so I'm adding some logging in case it happens again
		try {
			game.date.getFullYear();
		} catch (e) {
			console.log({ games, game });
			throw new Error(e);
		}
		const localTeamObject = { ...localTeam };
		applyPreviousIdentity(game.date.getFullYear(), localTeamObject);
		game.teams = [localTeamObject, game._opposition];
		if (game.isAway) {
			game.teams.reverse();
		}
		return game;
	});
}

export function formatDate(game, monthFormat = "MMMM", yearFormat = "yyyy") {
	const { dateRange, date, hasTime } = game;

	let string = "";

	if (dateRange) {
		const divider = Math.abs(dateRange) > 1 ? "-" : "/";

		const altDate = new Date(date).addDays(dateRange);
		const firstDate = new Date(Math.min(date, altDate));
		const secondDate = new Date(Math.max(date, altDate));

		//Check if the two are in the same month
		const sameMonth = firstDate.toString("M") === secondDate.toString("M");

		//If not, we include the month when adding the first date
		const firstDateFormat = `ddd dS${sameMonth ? "" : ` ${monthFormat}`}`;
		string += firstDate.toString(firstDateFormat);

		//Add the second date, with trailing slash or hyphen
		string += secondDate.toString(`${divider}ddd dS ${monthFormat}`);
	} else {
		string += date.toString(`dddd dS ${monthFormat}`);
	}

	//Add year
	if (yearFormat) {
		string += date.toString(` ${yearFormat}`);
	}

	//Add Time
	if (hasTime) {
		string += date.toString(" HH:mm");
	}

	return string;
}

export function getDateString(date) {
	//Get the current dates, set to midnight
	const gameDate = new Date(date.toDateString());
	const today = new Date(new Date().toDateString());

	//Work out days to go
	const daysToGo = (gameDate - today) / 1000 / 60 / 60 / 24;

	if (daysToGo < 0) {
		//In the past. Return full date
		return { status: "past", string: gameDate.toString("ddd dS MMMM") };
	} else if (daysToGo === 0) {
		//If the game is today, return either "today" or "tonight",
		//based on time
		const status = Number(date.toString("H")) < 18 ? "today" : "tonight";
		return { status, string: status };
	} else if (daysToGo === 1) {
		//If the game is tomorrow, simply return that
		return { status: "tomorrow", string: "tomorrow" };
	} else if (daysToGo < 7) {
		//Return the day of the week
		return { status: "thisWeek", string: gameDate.toString("dddd") };
	} else {
		//Over a week away. Return Full date
		return { status: "overAWeek", string: gameDate.toString("dddd dS MMMM") };
	}
}

export function getScoreString(game, useLongNames = false) {
	//Check we have a score
	const score = game.score || game.scoreOverride;
	if (score) {
		const { _opposition, isAway } = game;

		//Get local team object
		const localTeamObject = game.teams.find(t => t._id != _opposition._id);

		//Get the scores for each team;
		const localScore = score[localTeamObject._id];
		const oppositionScore = score[_opposition._id];

		//Get Local Team Name
		const localTeamName = useLongNames ? localTeamObject.name.long : localTeamObject.nickname;
		const oppositionName = _opposition.name[useLongNames ? "long" : "short"];

		//Ensure no null values
		if (localScore != null && oppositionScore != null) {
			//Create array
			const scoreArray = [localTeamName, " ", localScore, "-", oppositionScore, " ", oppositionName];

			//Reverse for away games
			if (isAway) {
				scoreArray.reverse();
			}

			//Return joined array
			return scoreArray.join("");
		}
	}

	//Otherwise return false
	return false;
}

export function getLastGame(id, gameList, limitToSameYear = false) {
	return getAdjacentGame(id, gameList, false, limitToSameYear);
}

export function getNextGame(id, gameList, limitToSameYear = false) {
	return getAdjacentGame(id, gameList, true, limitToSameYear);
}

function getAdjacentGame(id, gameList, next, limitToSameYear = false) {
	const { _teamType, date } = gameList[id];

	const list = _.chain(gameList)
		.filter(g => g._teamType == _teamType)
		.filter(g => !limitToSameYear || g.date.getFullYear() === date.getFullYear())
		.filter(g => (next ? g.date > date : g.date < date))
		.orderBy(["date"], [next ? "asc" : "desc"])
		.map(g => g._id)
		.value();
	return list.length ? list[0] : false;
}

export function getNeutralGame(id, neutralGames) {
	if (!neutralGames) {
		return false;
	}

	return (
		_.chain(neutralGames)
			.map(g => _.values(g))
			.flatten()
			.find(({ _id }) => _id == id)
			.value() || false
	);
}

export function getGameStarStats(game, player, overwriteThreshold = {}) {
	//Convert stat types into an objects with overwrite threshold if necessary
	const statTypes = _.chain(playerStatTypes)
		.cloneDeep()
		.map((obj, key) => {
			if (overwriteThreshold[key] !== undefined) {
				obj.requiredForGameStar = overwriteThreshold[key];
			}

			return {
				key,
				...obj
			};
		})
		.filter(s => s.requiredForGameStar !== null)
		.value();

	//Process player stats
	const processedStats = calculateAdditionalStats(
		game.playerStats.find(p => p._player == player._id).stats,
		new Date(game.date).getFullYear()
	);

	//Check for overrideGameStarStats defined at a game level;
	let overrideData;
	if (game.overrideGameStarStats) {
		overrideData = game.overrideGameStarStats.find(({ _player }) => _player == player._id);
	}

	//Loop through stat types and work out which values should be preserved
	const values = _.chain(statTypes)
		.map(({ key, moreIsBetter, requiredForGameStar }) => {
			let isValid;

			const value = processedStats[key];

			if (overrideData) {
				isValid = overrideData.stats.find(stat => stat == key);
			} else {
				//Check basic threshold
				if (value) {
					isValid = moreIsBetter ? value >= requiredForGameStar : value <= requiredForGameStar;
				}

				//Check for exceptions
				if ((key == "TS" && processedStats.TK < 25) || (key == "KS" && processedStats.G < 4)) {
					isValid = false;
				}
			}

			if (isValid) {
				let starPoints;
				if (moreIsBetter) {
					//Here we assume requiredForGameStar will never be 0
					starPoints = value / requiredForGameStar;
				} else if (value) {
					//If value is not 0, then a simple divide
					starPoints = requiredForGameStar / value;
				} else {
					starPoints = requiredForGameStar + 1;
				}

				//In case of game override, prevent negative starPoints
				starPoints = Math.max(starPoints, 1);
				return { key, value, starPoints };
			}
		})
		.filter(_.identity)
		.value();

	if (player._id == game._potm) {
		values.push({ key: "POTM", starPoints: 3, value: null });
	}
	if (game.fan_potm_winners && game.fan_potm_winners.find(winner => winner == player._id)) {
		values.push({ key: "FAN_POTM", starPoints: 3, value: null });
	}

	return values.map(({ key, value, starPoints }) => {
		let isBest = false;
		let valueString;
		let label;

		if (key == "POTM") {
			if (game.customPotmTitle) {
				valueString = game.customPotmTitle.label;
				label = " Winner";
			} else {
				valueString = game.genderedString;
				label = "of the Match";
			}
		} else if (key == "FAN_POTM") {
			valueString = "Fans'";
			label = `${game.genderedString} of the Match`;
		} else {
			//Get Value String
			switch (key) {
				case "TS":
					if (!values.find(v => v.key == "TK")) {
						const { TK, MI } = game.playerStats.find(p => p._player == player._id).stats;
						//Show Tackles
						valueString = statToString(key, value) + ` (${TK}/${TK + MI})`;

						//Factor Total tackles into starPoints
						starPoints = value / 100 + TK / 25;
					}
					break;
				case "M":
					valueString = value;
					break;
			}
			if (!valueString) {
				valueString = statToString(key, value);
			}

			//Label
			switch (key) {
				case "TS":
					label = "Tackling";
					break;
				case "KS":
					label = "Kicking";
					break;
				case "AG":
					label = "Avg Gain";
					break;
				default:
					label = playerStatTypes[key][value === 1 ? "singular" : "plural"];
					break;
			}

			//Check for 'best'
			const { moreIsBetter } = playerStatTypes[key];
			const allValues = game.playerStats.map(p => p.stats[key]);
			const bestValue = moreIsBetter ? _.max(allValues) : _.min(allValues);
			isBest = value === bestValue;
		}

		return { key, value: valueString, label, isBest, starPoints };
	});
}

export function convertTeamToSelect(game, teamList, singleTeam = false, includeNone = false, fromPregame = false) {
	function listToOptions(_player, team) {
		const p = _.find(game.eligiblePlayers[team], p => _player == p._id);
		const numberStr = p.number ? `${p.number}. ` : "";
		const label = numberStr + p.name.full;
		return { label, value: _player };
	}

	function pregameSort(p, team) {
		const player = _.find(game.eligiblePlayers[team], eP => eP._id == p);
		return player ? player.number : 999;
	}

	let options;
	if (fromPregame) {
		if (singleTeam) {
			options = _.chain(game.pregameSquads)
				.find(p => p._team == singleTeam)
				.sortBy(p => pregameSort(p, singleTeam))
				.map(p => listToOptions(p, singleTeam))
				.value();
		} else {
			options = _.chain(game.pregameSquads)
				.groupBy("_team")
				.mapValues(s => s[0].squad)
				.map((squad, team) => {
					const options = _.chain(squad)
						.sortBy(p => pregameSort(p, team))
						.map(p => listToOptions(p, team))
						.value();
					return { label: teamList[team].name.short, options };
				})
				.value();
		}
	} else {
		if (singleTeam) {
			options = _.chain(game.playerStats)
				.filter(p => p._team == singleTeam)
				.sortBy("position")
				.map(p => listToOptions(p._player, singleTeam))
				.value();
		} else {
			options = _.chain(game.playerStats)
				.groupBy("_team")
				.map((squad, team) => {
					const options = _.chain(squad)
						.sortBy("position")
						.map(p => listToOptions(p._player, team))
						.value();
					return { label: teamList[team].name.short, options };
				})
				.value();
		}
	}
	if (includeNone) {
		return [{ label: "None", value: "" }, ...options];
	} else {
		return options;
	}
}

export function getDynamicOptions(values, neutral, props, year) {
	const options = {
		_competition: [],
		teams: [],
		placeholders: {}
	};
	const { competitionSegmentList, teamList, localTeam } = props;

	//Pull all valid competition for the selected date and team type
	if ((values.date || year) && values._teamType) {
		const currentYear = year || new Date(values.date).getFullYear();
		const currentTeamType = values._teamType;

		options._competition = _.chain(competitionSegmentList)
			//Filter all competitions by team type
			.filter(({ _teamType }) => _teamType == currentTeamType)
			//Find those with corresponding instances for this year
			.filter(({ instances }) => instances.find(({ year }) => year == currentYear))
			//Convert to dropdown options
			.map(c => {
				//Pull in the name of the parent comp and the segment, and run "uniq"
				//to prevent something like "Preseason Friendly Preseason Friendly"
				const label = _.uniq([c._parentCompetition.name, c.name]).join(" ");
				return { label, value: c._id };
			})
			.value();

		//Remove the selected competition if it's not in the list
		if (!options._competition.find(option => option.value == values._competition)) {
			values._competition = "";
		}

		//Get available teams from selected competition
		if (values._competition) {
			const currentCompetition = competitionSegmentList[values._competition];

			//Get corresponding instance
			const instance = currentCompetition.instances.find(({ year }) => year == currentYear);

			//Look for teams
			options.teams = _.chain(teamList)
				//Filter based on instance
				.filter(({ _id }) => {
					//No local team in neutral games
					if (_id == localTeam) {
						return false;
					}

					if (instance.teams && instance.teams.length) {
						return instance.teams.indexOf(_id) > -1;
					} else {
						//No teams specified, all are valid
						return true;
					}
				})
				//Convert to dropdown options
				.map(team => {
					return { label: team.name.long, value: team._id };
				})
				.sortBy("label")
				.value();

			//Remove the selected teams if they're not in the list
			if (neutral) {
				if (!options.teams.find(option => option.value == values._homeTeam)) {
					values._homeTeam = "";
				}
				if (!options.teams.find(option => option.value == values._awayTeam)) {
					values._awayTeam = "";
				}
			} else {
				if (!options.teams.find(option => option.value == values._opposition)) {
					values._opposition = "";
				}
			}
		}
	}

	//Set placeholders
	if (!values.date) {
		options.placeholders._competition = "Select a date";
	} else if (!values._teamType) {
		options.placeholders._competition = "Select a team type";
	}

	if (!values._competition) {
		options.placeholders._team = "Select a competition";
	}

	return options;
}

export async function parseExternalGame(game, justGetScores = false, includeScoringStats = true) {
	//JSON-ify the game object
	game = JSON.parse(JSON.stringify(game));

	//Get Data
	const id = game.externalId;
	const { instance, _parentCompetition } = game._competition;
	const { webcrawlFormat } = _parentCompetition;
	const { webcrawlUrl, webcrawlReportPage } = webcrawlData[webcrawlFormat];
	const nameRegex = new RegExp(/[^A-Za-z\s]/, "gi");

	//Build URL
	const url = `${webcrawlUrl}${webcrawlReportPage}/${id}`;

	//Load HTML
	let html;
	try {
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false
		});
		const { data } = await axios.get(url, { httpsAgent });
		html = parse(data);
	} catch (error) {
		return { error };
	}

	//Get Teams
	const teams = _.chain(game.playerStats)
		.map("_team")
		.uniq()
		.map(team => {
			let isHome = team != game._opposition;
			if (game.isAway) {
				isHome = !isHome;
			}
			return [isHome ? "home" : "away", team];
		})
		.fromPairs()
		.value();

	if (justGetScores) {
		let results;
		try {
			if (webcrawlFormat == "SL") {
				results = html.querySelectorAll(".matchreportheader .col-2 h2").map(e => Number(e.text));
			} else if (webcrawlFormat == "RFL") {
				results = [html.querySelector(".home-score"), html.querySelector(".away-score")].map(e =>
					parseInt(e.text)
				);
			}
		} catch (error) {
			return { error };
		}

		if (results) {
			return {
				homePoints: results[0],
				awayPoints: results[1]
			};
		}
	} else {
		//Get Stat Types
		const statTypeIndexes = _.chain(playerStatTypes)
			.map((stat, key) => ({ key, ...stat }))
			//Remove aggregate stats
			.filter("storedInDatabase")
			//If includeScoringStats is false, only include non-scoring stats
			.filter(s => includeScoringStats || !s.scoreOnly || s.key == "MG")
			//If the competition instance is defined as score only, only include scoring-stats
			.filter(s => !instance.scoreOnly || s.scoreOnly)
			//Return the keys, swap PK and CN for G
			.map(({ key }) => (["PK", "CN"].indexOf(key) > -1 ? "G" : key))
			//Remove duplicate Gs
			.uniq()
			//Convert back to object
			.map(key => [key, null])
			.fromPairs()
			.value();

		//Convert to object
		const results = {};
		const hasStatsTable = html.querySelector("table.home-team");
		for (const ha in teams) {
			const team = teams[ha];

			//Create nested object
			results[team] = {};

			if (hasStatsTable) {
				//Get table Element
				const table = html.querySelector(`table.${ha}-team`);
				//Get column index. We go nth from the right due to inconsistent colspan
				const tableHeaderCells = table.querySelectorAll("thead th");
				const tableHeaderCellCount = tableHeaderCells.length;
				for (const stat in statTypeIndexes) {
					for (let i = 1; i <= tableHeaderCellCount; i++) {
						if (tableHeaderCells[tableHeaderCellCount - i].innerHTML.trim() == stat) {
							statTypeIndexes[stat] = i;
							break;
						}
					}
				}

				//Loop Players
				const playerRows = table.querySelectorAll("tbody tr");
				for (const row of playerRows) {
					const rowCells = row.querySelectorAll("td");
					const rowCellCount = rowCells.length;

					if (!rowCellCount) {
						continue;
					}

					const name = rowCells[1].innerHTML.trim();
					results[team][name] = {
						stats: {}
					};
					for (const stat in statTypeIndexes) {
						const index = statTypeIndexes[stat];
						if (!index) {
							continue;
						}
						const value = rowCells[rowCellCount - index].innerHTML.replace(/\D+/gi, "");
						results[team][name].stats[stat] = Number(value || 0);
					}
				}
			} else {
				//Otherwise, parse top of page
				//First, get the team short name for use later
				const teamPrefix = html.querySelector(`.${ha}-short-team`).rawText.trim() + ": ";
				const teamPrefixRegex = new RegExp(`^${teamPrefix}`);

				const scoreSections = html.querySelector(".scorers").childNodes;
				scoreSections.forEach(scoreSection => {
					if (scoreSection.querySelector) {
						const label = scoreSection.querySelector(".scoretype-label").rawText.trim();
						let statKey;
						switch (label) {
							case "Tries":
								statKey = "T";
								break;
							case "Goals":
								statKey = "CN";
								break;
							case "D Goals":
								statKey = "DG";
								break;
							default:
								throw `Unknown score type detected on ${url}: ${label}`;
						}

						const scorersRow = scoreSection
							.querySelectorAll("p")
							.find(p => p.rawText && p.rawText.trim().match(teamPrefixRegex));
						if (scorersRow) {
							scorersRow.text
								.replace(teamPrefix, "")
								.split(", ")
								.forEach(p => {
									const playerAndCount = p.split(/ x(\d+)/);
									const player = playerAndCount[0];
									const count = parseInt(playerAndCount[1] || 1);

									if (!results[team][player]) {
										results[team][player] = {
											stats: {}
										};
									}

									results[team][player].stats[statKey] = count;
								});
						}
					}
				});
			}
		}

		//Process Names
		_.each(results, teamList => {
			return _.each(teamList, (obj, name) => {
				obj.name = name.toUpperCase().replace(nameRegex, "");
			});
		});
		const playersToName = game.playerStats.map(({ _player, _team }) => ({
			_id: _player._id,
			name: (_player.externalName || _player.name.full).toUpperCase().replace(nameRegex, ""),
			_team,
			matched: false
		}));

		//Direct Matches
		_.each(results, (players, _team) => {
			_.each(players, player => {
				const result = _.chain(playersToName)
					.filter(p => p._team == _team)
					.reject("matched")
					.find(p => p.name == player.name)
					.value();

				if (result) {
					result.matched = true;
					player._player = result._id;
					player.match = "exact";
				}
			});
		});

		//Close Matches
		const noDirectMatches = _.reject(playersToName, "matched");
		if (noDirectMatches.length) {
			_.each(results, (players, _team) => {
				_.chain(players)
					.each(player => {
						if (player._player) {
							return true;
						}
						const name = player.name.split(" ").pop();
						const result = _.chain(playersToName)
							.filter(p => p._team == _team)
							.reject("matched")
							.filter(p => p.name.split(" ").pop() == name)
							.value();

						if (result.length === 1) {
							result[0].matched = true;
							player._player = result[0]._id;
							player.match = "partial";
						}
					})
					.value();
			});
		}

		return { results, playersToName, url };
	}
}

export function getYearsWithResults(gameYears) {
	return (
		_.chain(gameYears)
			.keys()
			//Remove 'fixtures'
			.map(year => parseInt(year))
			.reject(year => isNaN(year))
			.sort()
			.reverse()
			.value()
	);
}

export function getGameYearsNotYetLoaded(gameYears) {
	return _.chain(gameYears)
		.toPairs()
		.filter(arr => !arr[1])
		.map(arr => arr[0])
		.value();
}

export const calendarStringOptions = {
	teamName: ["short", "long"],
	teams: ["oppositionOnly", "localVs", "homeAway"],
	displayTeamTypes: ["all", "allButFirst", "none"],
	venue: ["short", "long", "none"],
	withBroadcaster: [true, false]
};

export function convertGameToCalendarString(game, options, teamTypes, localTeamName) {
	const { _opposition, isAway, _broadcaster, _teamType } = game;

	//Set Team Names
	let str = "";
	const oppositionName = _opposition.name[options.teamName];
	const localName = localTeamName[options.teamName];

	switch (options.teams) {
		case "oppositionOnly":
			str += oppositionName;
			break;
		case "localVs":
		case "homeAway": {
			const teams = [localName, oppositionName];
			if (options.teams === "homeAway" && isAway) {
				teams.reverse();
			}
			str += teams.join(" vs ");
			break;
		}
	}

	//Add TeamType
	const teamType = teamTypes[_teamType];
	if (options.displayTeamTypes === "all" || (options.displayTeamTypes === "allButFirst" && teamType.sortOrder > 1)) {
		str += ` ${teamTypes[_teamType].name}`;
	}

	//Venue
	if (options.venue === "short") {
		//Set Home/Away
		str += ` (${isAway ? "A" : "H"})`;
	} else if (options.venue === "long") {
		str += ` (${isAway ? "Away" : "Home"})`;
	}

	//Add Broadcaster
	if (options.withBroadcaster && _broadcaster) {
		str += ` - ${_broadcaster.name}`;
	}

	return str;
}

export function formatPlayerStatsForImage(game, player, statTypes, textStyles, colours, sizes) {
	const { stats } = game.playerStats.find(({ _player }) => _player._id == player);
	const processedStats = calculateAdditionalStats(stats, new Date(game.date).getFullYear());
	return statTypes
		.map(key => {
			let row;
			//Standard stat types
			switch (key) {
				case "potm": {
					//Ensure the player has the award in question
					if (game._potm != player) {
						return null;
					}
					const { customPotmTitle } = game;
					if (customPotmTitle) {
						row = [
							{
								text: customPotmTitle.label.toUpperCase(),
								colour: colours.gold,
								font: textStyles.statsValue.string
							}
						];
					} else {
						row = [
							{
								text: game.genderedString.toUpperCase(),
								colour: colours.gold,
								font: textStyles.statsValue.string
							},
							{
								text: " OF THE ",
								colour: "#FFF",
								font: textStyles.statsLabel.string
							},
							{
								text: "MATCH",
								colour: colours.gold,
								font: textStyles.statsValue.string
							}
						];
					}
					break;
				}
				case "fan_potm": {
					//Ensure the player has the award in question
					if (!game.fan_potm_winners || game.fan_potm_winners.indexOf(player) === -1) {
						return null;
					}
					row = [
						{
							text: key === "fan_potm" ? "FANS' " : "",
							colour: colours.fans,
							font: textStyles.statsValue.string
						},
						{
							text: game.genderedString.toUpperCase(),
							colour: colours.gold,
							font: textStyles.statsValue.string
						},
						{
							text: " OF THE ",
							colour: "#FFF",
							font: textStyles.statsLabel.string
						},
						{
							text: "MATCH",
							colour: colours.gold,
							font: textStyles.statsValue.string
						}
					];
					break;
				}

				//steel = "3 Man of Steel Points"
				//steel-points-only = "3 Points"
				case "steel":
				case "steel-points-only":
					if (game.manOfSteel && game.manOfSteel.length) {
						const entry = game.manOfSteel.find(({ _player }) => _player == player);
						if (entry) {
							const { points } = entry;

							//If the event type is just "steel", insert " Man of Steel" between number and " points"
							const fullStringFields = [];
							if (key === "steel") {
								fullStringFields.push(
									{
										text: ` ${game.genderedString.toUpperCase()} OF `,
										colour: "#FFF",
										font: textStyles.statsLabel.string
									},
									{
										text: "STEEL",
										colour: colours.gold,
										font: textStyles.statsValue.string
									}
								);
							}
							row = [
								{
									text: points,
									colour: colours.gold,
									font: textStyles.statsValue.string
								},
								...fullStringFields,
								{
									text: points === 1 ? " POINT" : " POINTS",
									colour: "#FFF",
									font: textStyles.statsLabel.string
								}
							];
						}
					}
					break;

				//Standard stat types
				default: {
					const { singular, plural } = playerStatTypes[key];
					const value = processedStats[key];

					//Only use toString if it's not metres,
					//as we don't want "120m Metres"
					const valueAsString = key === "M" ? value.toString() : statToString(key, value, 2);

					//Pick label based on value
					let label;
					switch (key) {
						case "TS":
							label = "Tackling";
							break;
						case "KS":
							label = "Kicking";
							break;
						default:
							label = value === 1 ? singular : plural;
							break;
					}

					row = [
						{
							text: valueAsString,
							colour: colours.gold,
							font: textStyles.statsValue.string
						},
						{
							text: ` ${label.toUpperCase().replace(" SUCCESS", "")}`,
							colour: "#FFF",
							font: textStyles.statsLabel.string
						}
					];
				}
			}

			if (row) {
				return row.map(r => ({
					...r,
					font: sizes && sizes[key] ? r.font.replace(/\d+/, sizes[key]) : r.font
				}));
			}
		})
		.filter(_.identity);
}

export function winLossOrDraw(game) {
	if (game.status < 2 || !game.score) {
		return null;
	}

	if (game.score[localTeam] > game.score[game._opposition._id]) {
		return "W";
	} else if (game.score[localTeam] < game.score[game._opposition._id]) {
		return "L";
	} else {
		return "D";
	}
}

export function calculatePoints(year, T, CN, PK, DG) {
	let points = 0;

	//Add Tries
	points += T * (year < 1983 ? 3 : 4);

	//Add Conversions
	points += CN * 2;

	//Add Penalties
	points += PK * (year < 1897 ? 3 : 2);

	//Add Drop Goals
	points += DG * (year < 1897 ? 4 : year < 1971 ? 2 : 1);

	return points;
}
