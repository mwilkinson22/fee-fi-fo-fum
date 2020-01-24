//Modules
import _ from "lodash";
import { parse } from "node-html-parser";
import axios from "axios";
import mongoose from "mongoose";

//Helpers
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";

//Constants
const playerStatTypes = require("~/constants/playerStatTypes");

export function validateGameDate(game, listType, year = null) {
	const now = new Date();

	if (listType === "results") {
		return game.date <= now && game.date.getFullYear() == year;
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

export async function postToIfttt(_profile, text, image) {
	//Get Profile
	const SocialProfile = mongoose.model("socialProfiles");
	const profile = await SocialProfile.findById(_profile).lean();

	let event = "facebook";
	const data = {
		value1: text
	};

	if (image) {
		event += "_with_photo";
		data.value2 = image;
	}
	const res = await axios.post(
		`https://maker.ifttt.com/trigger/${event}/with/key/${profile.iftttKey}`,
		data
	);
	return res;
}

function getAdjacentGame(id, gameList, next) {
	const { _teamType, date } = gameList[id];
	const list = _.chain(gameList)
		.filter(g => g._teamType == _teamType)
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

export function getLastGame(id, gameList) {
	return getAdjacentGame(id, gameList, false);
}

export function getNextGame(id, gameList) {
	return getAdjacentGame(id, gameList, true);
}

export function getGameStarStats(game, player, overwriteThreshold = {}) {
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

	const processedStats = PlayerStatsHelper.processStats(
		game.playerStats.find(p => p._player == player._id).stats
	);
	const values = _.chain(statTypes)
		.map(({ key, moreIsBetter, requiredForGameStar }) => {
			let isValid;

			const value = processedStats[key];

			//Check basic threshold
			if (value) {
				isValid = moreIsBetter
					? value >= requiredForGameStar
					: value <= requiredForGameStar;
			}

			//Check for exceptions
			if ((key == "TS" && processedStats.TK < 25) || (key == "KS" && processedStats.G < 4)) {
				isValid = false;
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
			valueString = game.genderedString;
			label = "of the Match";
		} else if (key == "FAN_POTM") {
			valueString = "Fans'";
			label = `${game.genderedString} of the Match`;
		} else {
			//Get Value String
			switch (key) {
				case "TS":
					if (!values.find(v => v.key == "TK")) {
						const { TK, MI } = game.playerStats.find(p => p._player == player.id).stats;
						//Show Tackles
						valueString =
							PlayerStatsHelper.toString(key, value) + ` (${TK}/${TK + MI})`;

						//Factor Total tackles into starPoints
						starPoints = value / 100 + TK / 25;
					}
					break;
				case "M":
					valueString = value;
					break;
			}
			if (!valueString) {
				valueString = PlayerStatsHelper.toString(key, value);
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

export function convertTeamToSelect(
	game,
	teamList,
	singleTeam = false,
	includeNone = false,
	fromPregame = false
) {
	function listToOptions(_player, team) {
		const p = _.find(game.eligiblePlayers[team], p => _player == p._player._id);
		const numberStr = p.number ? `${p.number}. ` : "";
		const label = numberStr + p._player.name.full;
		return { label, value: _player };
	}

	function pregameSort(p, team) {
		const player = _.find(game.eligiblePlayers[team], eP => eP._player._id == p);
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

export function getDynamicOptions(values, neutral, props) {
	const options = {
		_competition: [],
		teams: [],
		placeholders: {}
	};
	const { competitionSegmentList, teamList, localTeam } = props;

	//Pull all valid competition for the selected date and team type
	if (values.date && values._teamType) {
		const currentYear = new Date(values.date).getFullYear();
		const currentTeamType = values._teamType;

		options._competition = _.chain(competitionSegmentList)
			//Filter all competitions by team type
			.filter(({ _teamType }) => _teamType == currentTeamType)
			//Find those with corresponding instances for this year
			.filter(({ multipleInstances, instances }) => {
				if (multipleInstances) {
					return instances.find(({ year }) => year == currentYear);
				} else {
					return instances.length;
				}
			})
			//Convert to dropdown options
			.map(c => ({ label: c.name, value: c._id }))
			.value();

		//Remove the selected competition if it's not in the list
		if (!options._competition.find(option => option.value == values._competition)) {
			values._competition = "";
		}

		//Get available teams from selected competition
		if (values._competition) {
			const currentCompetition = competitionSegmentList[values._competition];

			//Get corresponding instance
			let instance;
			if (currentCompetition.multipleInstances) {
				instance = currentCompetition.instances.find(({ year }) => year == currentYear);
			} else {
				instance = currentCompetition.instances[0];
			}

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
	const { externalReportPage, instance, _parentCompetition } = game._competition;
	const { webcrawlFormat, webcrawlUrl } = _parentCompetition;
	const nameRegex = new RegExp(/[^A-Za-z\s]/, "gi");

	//Build URL
	const url = `${webcrawlUrl}${externalReportPage}/${id}`;

	//Load HTML
	const { data } = await axios.get(url);
	const html = parse(data);

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
		if (webcrawlFormat == "SL") {
			results = html
				.querySelectorAll(".matchreportheader .col-2 h2")
				.map(e => Number(e.text));
		} else if (webcrawlFormat == "RFL") {
			results = html
				.querySelector(".overview h3")
				.text.match(/\d+/g)
				.map(Number);
		}

		return {
			homePoints: results[0],
			awayPoints: results[1]
		};
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
		switch (webcrawlFormat) {
			case "SL":
				for (const ha in teams) {
					const team = teams[ha];

					//Create nested object
					results[team] = {};

					//Get Table Element
					const table = html.querySelector(`table.${ha}-team`);

					//Get column index. We go nth from the right due to inconsistent colspan
					const tableHeaderCells = table.querySelectorAll("thead th");
					const tableHeaderCellCount = tableHeaderCells.length;
					for (const stat in statTypeIndexes) {
						for (let i = 1; i <= tableHeaderCellCount; i++) {
							if (
								tableHeaderCells[tableHeaderCellCount - i].innerHTML.trim() == stat
							) {
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
							const value = rowCells[rowCellCount - index].innerHTML.replace(
								/\D+/gi,
								""
							);
							results[team][name].stats[stat] = Number(value || 0);
						}
					}
				}
				break;
			case "RFL":
				//This currently just loads scores, as there are no opta stats on the rfl site
				for (const ha in teams) {
					const team = teams[ha];

					//Create nested object
					results[team] = {};

					//Get Rows
					const lists = html.querySelectorAll(".tryScorersRow ul");
					const rows = lists[ha == "home" ? 0 : 1].querySelectorAll("li");
					for (const row of rows) {
						const title = row.querySelector("h4 span");
						if (title) {
							let stat;
							//Get Key From Text
							switch (title.rawText.trim()) {
								case "Tries":
									stat = "T";
									break;
								case "Goals":
									stat = "G";
									break;
								case "Drop Goals":
									stat = "DG";
									break;
							}
							const statList = row.text
								.replace(new RegExp(`^${title.rawText.trim()}`, "gi"), "")
								.trim();
							if (stat && statList.length) {
								statList.split(",").forEach(s => {
									let [name, count] = s.split(/(?=\(\d)/);

									//Get Name
									name = name.trim();
									if (!name) {
										return true;
									}

									//Get Total
									let total;
									if (count) {
										total = Number(count.replace(/\D/gi, ""));
									} else {
										total = 1;
									}

									if (!results[team][name]) {
										results[team][name] = { stats: {} };
									}
									results[team][name].stats[stat] = total;
								});
							}
						}
					}
				}
				break;
			default:
				return false;
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
	if (
		options.teamTypes === "all" ||
		(options.teamTypes === "allButFirst" && teamType.sortOrder > 1)
	) {
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
	const processedStats = PlayerStatsHelper.processStats(stats);
	return statTypes
		.map(key => {
			let row;
			//Standard stat types
			switch (key) {
				case "potm":
				case "fan_potm": {
					//Ensure the player has the award in question
					if (key === "potm" && game._potm != player) {
						return null;
					} else if (
						key === "fan_potm" &&
						(!game.fan_potm_winners || game.fan_potm_winners.indexOf(player) === -1)
					) {
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
					const valueAsString =
						key === "M" ? value.toString() : PlayerStatsHelper.toString(key, value, 2);

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
