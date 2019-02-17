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
import { getScores } from "../../controllers/rugby/gamesController";
async function updateLeagueTable(_competition, date, teams) {
	//Get main games
	let games = await Game.find({ _competition, date }, "_opposition isAway playerStats date");
	games = games.map(game => {
		const { _opposition, scores, isAway } = getScores(game);
		const _homeTeam = isAway ? _opposition : localTeam;
		const _awayTeam = isAway ? localTeam : _opposition;
		return {
			_homeTeam,
			_awayTeam,
			homePoints: scores[_homeTeam],
			awayPoints: scores[_awayTeam]
		};
	});

	//Add Neutral Games
	const neutralGames = await NeutralGame.find(
		{
			_competition,
			date
		},
		"_homeTeam _awayTeam homePoints awayPoints"
	);

	//Process Results
	for (const game of games.concat(neutralGames)) {
		const { _homeTeam, _awayTeam, homePoints, awayPoints } = game;
		const result = {};
		if (homePoints > awayPoints) {
			result.home = "w";
			result.away = "l";
		} else if (awayPoints > homePoints) {
			result.home = "l";
			result.away = "w";
		} else {
			result.home = result.away = "d";
		}
		if (teams[_homeTeam]) {
			const { data } = teams[_homeTeam];
			data.f += homePoints;
			data.a += awayPoints;
			data[result.home]++;
		}
		if (teams[_awayTeam]) {
			const { data } = teams[_awayTeam];
			data.f += awayPoints;
			data.a += homePoints;
			data[result.away]++;
		}
	}
}

module.exports = app => {
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
			const tableMeta = _.pick(instance, ["leagueTableColours", "sponsor", "image"]);

			//Get Teams and implement tallies
			const tallies = ["w", "d", "l", "f", "a"];
			let teams = await Team.find({ _id: { $in: instance.teams } }, "name image");
			teams = _.chain(teams)
				.keyBy("_id")
				.mapValues(team => {
					const { name, image } = team;
					const data = tallies.reduce(function(o, v) {
						return (o[v] = 0), o;
					}, {});
					return { name: name.short, image, data };
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
				await updateLeagueTable(competition_id, dateObj, teams);
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
				const { data } = team;
				data.diff = data.f - data.a;
				data.pts = data.w * 2 + data.d;
				data.pld = data.w + data.d + data.l;
			});

			const table = { ...tableMeta, teams };
			res.send(table);
		}
	});
};
