import mongoose from "mongoose";
import _ from "lodash";

//Constants
import { localTeam } from "../../config/keys";

//Models
const CompetitionSegment = mongoose.model("competitionSegments");
const Team = mongoose.model("teams");
const Game = mongoose.model("games");
const NeutralGame = mongoose.model("neutralGames");

//Helper functions
import { getVirtuals } from "../../controllers/rugby/gamesController";

//Setters
async function updateLeagueTable(_competition, date, teams, adjustments = []) {
	//Get main games
	let games = await Game.find({ _competition, date }, "_opposition isAway playerStats date");
	games = _.map(games, game => {
		const { _opposition, scores, isAway } = getVirtuals(game);
		const _homeTeam = isAway ? _opposition : localTeam;
		const _awayTeam = isAway ? localTeam : _opposition;
		if (scores) {
			return {
				_homeTeam,
				_awayTeam,
				homePoints: scores[_homeTeam],
				awayPoints: scores[_awayTeam]
			};
		} else {
			return null;
		}
	});

	//Add Neutral Games
	const neutralGames = await NeutralGame.find(
		{
			_competition,
			date
		},
		"_homeTeam _awayTeam homePoints awayPoints"
	);

	const allGames = _.pickBy(games.concat(neutralGames), _.identity);

	//Process Results
	_.each(allGames, game => {
		const { _homeTeam, _awayTeam, homePoints, awayPoints } = game;
		const result = {};
		if (homePoints > awayPoints) {
			result.home = "W";
			result.away = "L";
		} else if (awayPoints > homePoints) {
			result.home = "L";
			result.away = "W";
		} else {
			result.home = result.away = "D";
		}
		if (teams[_homeTeam]) {
			const team = teams[_homeTeam];
			team.F += homePoints;
			team.A += awayPoints;
			team[result.home]++;
			switch (result.home) {
				case "W":
					team.Pts += 2;
					break;
				case "D":
					team.Pts += 1;
					break;
			}
		}
		if (teams[_awayTeam]) {
			const team = teams[_awayTeam];
			team.F += awayPoints;
			team.A += homePoints;
			team[result.away]++;
			switch (result.home) {
				case "W":
					team.Pts += 2;
					break;
				case "D":
					team.Pts += 1;
					break;
			}
		}
	});

	//Process Adjustments
	_.map(adjustments, a => {
		const { _team, adjustment } = a;
		if (teams[_team]) {
			teams[_team].Pts += adjustment;
		}
	});
}

module.exports = app => {
	app.get("/api/addAdjustments", async (req, res) => {
		const competitionSegments = await CompetitionSegment.find();
		_.each(competitionSegments, async c => {
			await c.save();
		});
		res.send({});
	});
	app.get("/api/leagueTable/:competition_id/:year", async (req, res) => {
		let { competition_id, year } = req.params;
		let competition = await CompetitionSegment.findOne({
			_id: competition_id,
			"instances.year": year
		});
		if (!competition) {
			res.status(404).send("Competition not found");
		} else {
			//Get Table Meta
			const instance = _.keyBy(competition.instances, "year")[year];
			const tableMeta = _.pick(instance, ["sponsor", "image"]);

			//Get Teams and implement tallies
			const tallies = ["W", "D", "L", "F", "A", "Pts"];
			let teams = await Team.find({ _id: { $in: instance.teams } }, "name image");
			teams = _.chain(teams)
				.keyBy("_id")
				.mapValues(team => {
					const { name, image, _id } = team;
					const data = tallies.reduce(function(o, v) {
						return (o[v] = 0), o;
					}, {});
					return { _id, name: name.short, image, ...data };
				})
				.value();

			//Get Game Data
			let { fromDate, toDate } = req.query;
			fromDate = new Date(fromDate || `${year}-01-01`);
			if (toDate) {
				toDate = new Date(toDate);
			} else {
				const now = new Date();
				const endOfYear = new Date(`${year}-12-31`);
				toDate = now < endOfYear ? now : endOfYear;
			}
			const dateObj = {
				$gte: fromDate,
				$lte: toDate
			};

			//Loop through relevant competitions to get data
			while (competition_id) {
				await updateLeagueTable(competition_id, dateObj, teams, instance.adjustments);
				competition_id = competition._pointsCarriedFrom;
				if (competition_id) {
					competition = await CompetitionSegment.findOne({
						_id: competition_id,
						"instances.year": year
					});
				}
			}

			//Set Points and Points Difference
			_.each(teams, team => {
				team.Diff = team.F - team.A;
				team.Pld = team.W + team.D + team.L;
			});

			//Process final table
			let position = 0;
			teams = _.chain(teams)
				//Convert to array
				.map(team => team)
				//Order
				.orderBy(
					["Pts", "Diff", "F", "Pld", "name"],
					["desc", "desc", "desc", "asc", "asc"]
				)
				//Add position and classnames
				.map(team => {
					position++;
					const classNames = [];
					_.each(instance.leagueTableColours, classObj => {
						if (classObj.position.indexOf(position) > -1) {
							classNames.push(classObj.className);
						}
					});
					return { position, classNames, ...team };
				})
				.value();

			const table = { ...tableMeta, teams };
			res.send(table);
		}
	});
};
