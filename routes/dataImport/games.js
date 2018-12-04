const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "games";
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");
const Ground = mongoose.model("grounds");
const IdLink = mongoose.model("IdLinks");
const SlugRedirect = mongoose.model("slugRedirect");
const playerStatTypes = require("../../constants/playerStatTypes");

module.exports = app => {
	app.post("/api/games", async (req, res) => {
		async function createSlug(opposition, dateStr) {
			const team = await Team.findById(opposition);
			const date = await new Date(dateStr);
			return [
				team.name.short,
				date.getFullYear(),
				("0" + (date.getMonth() + 1)).slice(-2),
				("0" + date.getDate()).slice(-2)
			]
				.join("-")
				.replace(/\s/g, "-")
				.replace(/[^A-Za-z0-9-]/gi, "")
				.toLowerCase();
		}

		async function createPregameSquads(str) {
			if (str === null) return null;
			const playerIds = str.split(",");
			const players = [];
			for (var i = 0; i < playerIds.length; i++) {
				let player = await IdLink.convertId(playerIds[i], "people");
				players.push(player);
			}
			return players;
		}

		async function getGround(sqlGround, teamId) {
			if (sqlGround) {
				const groundId = await IdLink.convertId(sqlGround, "grounds");
				return Ground.findById(groundId);
			} else {
				const teamMongoId = await IdLink.convertId(teamId, "teams");
				const team = await Team.findById(teamMongoId);
				return Ground.findById(team._ground);
			}
		}

		await _.each(req.body, async sql => {
			try {
				//Get Variables
				const competition = await IdLink.convertId(
					sql.comp_id,
					"competitionSegments"
				);
				const opposition = await IdLink.convertId(
					sql.opposition_id,
					"teams"
				);
				const isAway = sql.away == 1;
				let homePregame;
				let awayPregame;
				if (isAway) {
					homePregame = await createPregameSquads(
						sql.opposition_pregame_squad
					);
					awayPregame = await createPregameSquads(
						sql.huddersfield_pregame_squad
					);
				} else {
					homePregame = await createPregameSquads(
						sql.huddersfield_pregame_squad
					);
					awayPregame = await createPregameSquads(
						sql.opposition_pregame_squad
					);
				}

				const ground = await getGround(
					sql.ground,
					isAway ? sql.opposition_id : 1
				);

				const motm = sql.motm
					? await IdLink.convertId(sql.motm, "people")
					: null;
				const fan_motm = sql.fan_motm
					? await IdLink.convertId(sql.fan_motm, "people")
					: null;

				const referee = sql.ref
					? await IdLink.convertId(sql.ref, "people")
					: null;
				const videoReferee = sql.video_ref
					? await IdLink.convertId(sql.video_ref, "people")
					: null;

				//Create New Entry
				const newEntry = new Game({
					_competition: competition,
					_opposition: opposition,
					isAway,
					date: new Date(sql.date),
					pregameSquads: {
						home: homePregame,
						away: awayPregame
					},
					_ground: ground,
					Title: sql.title,
					Hashtags: sql.hashtag ? [sql.hashtag] : null,
					_motm: motm,
					_fan_motm: fan_motm,
					fan_motm_link: sql.fan_motm_link,
					_referee: referee,
					_video_referee: videoReferee,
					attendance: sql.attendance,
					tv: {
						sky: sql.sky == 1,
						bbc: sql.bbc == 1
					},
					rflFixtureId: null,
					slug: await createSlug(opposition, sql.date)
				});
				await newEntry.save();
				//Add new newEntry to idLink document
				await new IdLink({
					_id: newEntry._id,
					sqlId: sql.id,
					collectionName
				}).save();

				//Update SlugRedirect
				await new SlugRedirect({
					oldSlug: sql.id,
					collectionName,
					itemId: newEntry._id
				}).save();
			} catch (error) {
				console.log(error);
			}
		});
		res.send({});
	});

	app.post("/api/games/events", async (req, res) => {
		await _.each(req.body, async sql => {
			const gameId = await IdLink.convertId(sql.fixture_id, "games");
			const game = await Game.findById(gameId);
			const playerId = await IdLink.convertId(sql.people_id, "people");
			const teamId = await IdLink.convertId(sql.team_id, "teams");

			const sqlStats = sql;

			const stats = await _.chain(playerStatTypes)

				.mapValues((obj, stat) => {
					return sql[stat];
				})
				.pickBy(_.identity)
				.value();

			await game.playerStats.push({
				_player: playerId,
				_team: teamId,
				position: sql.position,
				stats
			});

			await game.save();
		});
		res.send({});
	});

	app.delete("/api/games/events", async (req, res) => {
		await Game.updateMany({}, { playerStats: [] });
		res.send({});
	});

	app.delete("/api/games", async (req, res) => {
		await Game.deleteMany({});
		await SlugRedirect.deleteMany({ collectionName });
		await IdLink.deleteMany({ collectionName });
		res.send({});
	});
};
