//Modules
import _ from "lodash";
import { parse } from "node-html-parser";
import axios from "axios";
import twitter from "~/services/twitter";
import https from "https";

//Mongoose
import mongoose from "mongoose";
const Competition = mongoose.model("competitions");
const Segment = mongoose.model("competitionSegments");
const Game = mongoose.model("games");
const NeutralGame = mongoose.model("neutralGames");
const Team = mongoose.model("teams");

//Images
import LeagueTable from "~/images/LeagueTable";
import MinMaxLeagueTable from "~/images/MinMaxLeagueTable";

//Constants
import { localTeam } from "~/config/keys";

//Helpers
import { postToSocial } from "../oAuthController";
import { getMainTeamType } from "~/controllers/rugby/teamsController";
import { getGamesByAggregate } from "~/controllers/rugby/gamesController";
import { getSegmentBasicTitle } from "~/models/rugby/CompetitionSegment";

function getGameQuery(_competition, year = null) {
	const query = { _competition };
	if (year) {
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: new Date(`${Number(year) + 1}-01-01`)
		};
	}
	return query;
}

async function validateCompetition(_id, res) {
	if (!_id) {
		if (res) {
			res.status(400).send(`No id provided`);
		}
		return;
	}

	const competition = await Competition.findById(_id);
	if (competition) {
		return competition;
	} else {
		res.status(404).send(`No competition found with id ${_id}`);
		return false;
	}
}

async function validateSegment(_id, res) {
	if (!_id) {
		if (res) {
			res.status(400).send(`No segment id provided`);
		}
		return;
	}

	const segment = await Segment.findById(_id);
	if (segment) {
		return segment;
	} else {
		res.status(404).send(`No competition segment found with id ${_id}`);
		return false;
	}
}

async function validateInstance(segment, _id, res) {
	if (!_id) {
		if (res) {
			res.status(400).send(`No instance id provided`);
		}
		return;
	}

	const instance = segment.instances.find(instance => instance._id == _id);
	if (instance) {
		return instance;
	} else {
		res.status(404).send(`No competition instance found with id ${_id}`);
		return null;
	}
}

async function getUpdatedSegment(_id, res = null) {
	const updatedCompetition = await Segment.findById(_id).populate("_parentCompetition");
	res.send(updatedCompetition);
}

//Create
export async function createCompetition(req, res) {
	const competition = new Competition(req.body);
	await competition.save();
	const savedCompetition = await Competition.findById(competition._id).lean();
	res.send(savedCompetition);
}

export async function createSegment(req, res) {
	const segment = new Segment(req.body);
	await segment.save();
	await getUpdatedSegment(segment._id, res);
}

export async function createInstance(req, res) {
	const { segmentId } = req.params;
	let segment = await validateSegment(segmentId, res);
	if (segment) {
		//Create instance object, with ID we can refer to later
		const instance = {
			_id: mongoose.Types.ObjectId(),
			...req.body
		};

		//Save it to the segment
		segment.instances.push(instance);
		await segment.save();

		//Get updated segment
		segment = await Segment.findById(segmentId).populate("_parentCompetition");
		res.send({
			instanceId: instance._id,
			segment
		});
	}
}

//Read
export async function getCompetitions(req, res) {
	const competitions = await Competition.find({}).lean();
	res.send(_.keyBy(competitions, "_id"));
}

export async function getSegments(req, res) {
	const segments = await Segment.find({}).populate("_parentCompetition");
	res.send(_.keyBy(segments, "_id"));
}

//Update
export async function updateCompetition(req, res) {
	const { _id } = req.params;
	const competition = await validateCompetition(_id, res);
	if (competition) {
		await competition.updateOne(req.body);
		const updatedCompetition = await Competition.findById(_id).lean();
		res.send(updatedCompetition);
	}
}

export async function updateSegment(req, res) {
	const { _id } = req.params;
	const segment = await validateSegment(_id, res);
	if (segment) {
		await segment.updateOne(req.body);
		await getUpdatedSegment(_id, res);
	}
}

export async function updateInstance(req, res) {
	const { segmentId, instanceId } = req.params;
	const segment = await validateSegment(segmentId, res);
	if (segment) {
		const instance = await validateInstance(segment, instanceId, res);
		if (instance) {
			let error;

			//Overview
			if (req.body.hasOwnProperty("teams")) {
				//Check to see if any games depend on this instance.
				let gameCheck = false;

				//This only applies if we're naming teams in the update
				//If we haven't named any, then all teams are valid
				if (req.body.teams) {
					if (instance.teams) {
						//If we've already named teams, check for any we've removed
						gameCheck = instance.teams.filter(id => !req.body.teams.find(t => t == id)).length;
					} else {
						//If we haven't already named teams, and are now adding them,
						//we always need to check
						gameCheck = true;
					}
				}

				if (gameCheck) {
					//Regardless of how gameCheck === true happened,
					//we just need to check there are no
					//games depending on unlisted teams
					const query = getGameQuery(segmentId, instance.year);
					const games = await Game.find(
						{ ...query, _opposition: { $nin: req.body.teams } },
						"slug _opposition"
					).lean();
					const neutralGames = await NeutralGame.find(
						{
							...query,
							$or: [{ _homeTeam: { $nin: req.body.teams } }, { _awayTeam: { $nin: req.body.teams } }]
						},
						"_id _homeTeam _awayTeam"
					).lean();

					const totalGames = games.length + neutralGames.length;
					if (totalGames) {
						error = {
							error: `Error editing teams: ${totalGames} dependent ${
								totalGames == 1 ? "game features" : "games feature"
							} unlisted teams`,
							toLog: { games, neutralGames }
						};
					}
				}
			}

			if (error) {
				res.status(409).send(error);
			} else {
				const updateObject = _.chain(req.body)
					.map((val, key) => [`instances.$.${key}`, val])
					.fromPairs()
					.value();
				await Segment.updateOne({ _id: segmentId, "instances._id": instanceId }, { $set: updateObject });
				await getUpdatedSegment(segmentId, res);
			}
		}
	}
}

//Delete
export async function deleteCompetition(req, res) {
	const { _id } = req.params;
	const competition = await validateCompetition(_id, res);
	if (competition) {
		const segments = await Segment.find({ _parentCompetition: _id }, "name");

		if (segments.length) {
			res.status(409).send({
				error: `Competition cannot be deleted as ${segments.length} Competition ${
					segments.length == 1 ? "segment depends" : "segments depend"
				} on it`,
				toLog: { segments }
			});
		} else {
			await competition.remove();
			res.send({});
		}
	}
}

export async function deleteSegment(req, res) {
	const { _id } = req.params;
	const segment = await validateSegment(_id, res);
	if (segment) {
		const games = await Game.find({ _competition: _id }, "slug");

		if (games.length) {
			res.status(409).send({
				error: `Competition Segment cannot be deleted as ${games.length} ${
					games.length == 1 ? "game depends" : "games depend"
				} on it`,
				toLog: { games }
			});
		} else {
			await segment.remove();
			res.send({});
		}
	}
}

export async function deleteInstance(req, res) {
	const { segmentId, instanceId } = req.params;
	const segment = await validateSegment(segmentId, res);
	if (segment) {
		const instance = await validateInstance(segment, instanceId, res);
		if (instance) {
			//Ensure no games rely on the segment
			const query = getGameQuery(segmentId, instance.year);
			const games = await Game.find(query, "slug");
			const neutralGames = await NeutralGame.find(query, "_id");

			const totalGames = games.length + neutralGames.length;

			if (games.length) {
				res.status(409).send({
					error: `Competition Instance cannot be deleted as ${totalGames} ${
						totalGames == 1 ? "game depends" : "games depend"
					} on it`,
					toLog: { games, neutralGames }
				});
			} else {
				await segment.updateOne({ $pull: { instances: { _id: instanceId } } });
				await getUpdatedSegment(segmentId, res);
			}
		}
	}
}

export async function crawlNewGames(req, res) {
	const { _segment } = req.params;
	try {
		//Get Segment model
		const segment = await Segment.findById(_segment, [
			"externalCompId",
			"externalDivId",
			"_parentCompetition"
		]).populate({
			path: "_parentCompetition",
			select: "webcrawlUrl webcrawlFormat webcrawlFixturesPage"
		});

		if (!segment) {
			res.status(404).send(`No competition found with segment id '${_segment}'`);
			return false;
		}

		const { webcrawlFormat, webcrawlUrl, webcrawlFixturesPage } = segment._parentCompetition;

		//Add params
		let params;
		switch (webcrawlFormat) {
			case "SL": {
				params = {
					ajax: 1,
					type: "loadPlugin",
					plugin: "match_center",
					"params[limit]": 100000,
					"params[compID]": segment.externalCompId,
					"params[preview_link]": "/match-centre/preview",
					"params[report_link]": "/match-centre/report",
					"params[displayType]": "fixtures"
				};
				break;
			}
			case "RFL": {
				params = {
					ajax_request: "match_centre",
					load_type: "fixture",
					start: 0,
					qty: 10000,
					"cms_params[fix]": "Yes",
					"cms_params[res]": "No",
					"cms_params[table]": "No",
					"cms_params[comps]": segment.externalCompId
				};

				if (segment.externalDivId) {
					params["divID"] = segment.externalDivId;
				}
			}
		}

		//Build URL
		const paramString = encodeURI(_.map(params, (val, key) => `${key}=${val}`).join("&"));
		const url = `${webcrawlUrl}${webcrawlFixturesPage}?${paramString}`;

		//Load HTML
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false
		});
		const { data } = await axios.get(url, { httpsAgent });
		const html = parse(data);

		//Get empty object to store games
		const games = [];

		//Loop through the rows
		switch (webcrawlFormat) {
			case "SL": {
				let date;
				html.querySelector(".row.matches div").childNodes.forEach(row => {
					//Add Date
					if (row.tagName === "H3") {
						//Convert Date to Array
						const dateAsArray = row.rawText.split(" ");

						//Remove day of week
						dateAsArray.shift();

						//Remove ordinal suffix
						dateAsArray[0] = dateAsArray[0].replace(/\D/g, "");

						//Create day string
						date = dateAsArray.join(" ");
					} else if (row.tagName === "DIV" && row.classNames.indexOf("fixture-card") > -1) {
						//Check for teams
						const [home, away] = row
							.querySelectorAll(".team-name")
							.map(e => e && e.rawText && e.rawText.trim());

						if (home && away) {
							//Create Game Object
							const game = { home, away };

							//Get Datetime
							const time = row
								.querySelector(".fixture-wrap .middle")
								.rawText.trim()
								//Split by "UK: " and pop to get the local time for intl games
								.split("UK: ")
								.pop();

							game.date = new Date(`${date} ${time}:00`);

							//Get External ID
							game.externalId = row.querySelector("a").attributes.href.replace(/\D/g, "");

							//Get Round
							const roundString = row.querySelector(".fixture-footer").rawText.match(/Round: \d+/);
							if (roundString) {
								game.round = roundString[0].replace(/\D/g, "");
							}

							//Look for broadcasters
							game.broadcasters = row.querySelectorAll(".fixture-footer img").map(e => e.attributes.src);

							//Add game to array
							games.push(game);
						}
					}
				});
				break;
			}
			case "RFL": {
				//Each 'section' contains a date anda list of games for that date
				html.querySelectorAll("section.competition").forEach(section => {
					//Get the date
					const dateAsArray = section.childNodes.find(n => n.tagName === "H2").rawText.split(" ");

					//Remove day of week
					dateAsArray.shift();

					//Remove ordinal suffix
					dateAsArray[0] = dateAsArray[0].replace(/\D/g, "");

					//Create date string
					const date = dateAsArray.join(" ");

					//Loop Games
					section.querySelectorAll("li").forEach(row => {
						const game = {};

						//Get Teams
						game.home = row.querySelector(".home").rawText.trim();
						game.away = row.querySelector(".away").rawText.trim();

						//Get External ID
						game.externalId = row.querySelector("a").attributes.href.replace(/\D/g, "");

						//Get Round
						const roundString = row.querySelector(".left").rawText.match(/Round: \d+/);
						if (roundString) {
							game.round = roundString[0].replace(/\D/g, "");
						}

						//Get Time
						const timeElements = row.querySelectorAll(".ko").map(e => e.rawText.trim());

						//Check for games with multiple timezones
						let time = "00:00";
						if (timeElements.length === 1) {
							time = timeElements[0];
						} else {
							const ukTimeElem = timeElements.find(e => e.match(" UK"));
							if (ukTimeElem) {
								const ukTime = ukTimeElem.match(/\d+:\d+/);
								if (ukTime) {
									time = ukTime[0];
								}
							}
						}

						game.date = new Date(`${date} ${time}:00`);

						games.push(game);
					});
				});
				break;
			}
		}
		res.send(games);
	} catch (err) {
		res.status(500).send({ toLog: err.toString() });
	}
}

//Get League Table Data
export async function getLeagueTableData(req, res) {
	const { _segment, year } = req.params;
	const data = await processLeagueTableData(_segment, year, req.query);

	if (data && data.error) {
		res.status(406).send(data.error);
	} else {
		res.send({ ...data, loaded: new Date() });
	}
}

export async function getHomepageLeagueTableData(req, res) {
	const teamType = await getMainTeamType("_id");
	const leagues = await Segment.find({ type: "League" }, "_id").lean();
	const latestGame = await Game.findOne(
		{
			hideGame: { $in: ["false", null] },
			_competition: { $in: leagues.map(l => l._id) },
			_teamType: teamType._id
		},
		"_competition date"
	)
		.sort({ date: -1 })
		.lean();

	//If we have no league games, return an empty object
	if (!latestGame) {
		res.send({});
	}

	const _competition = latestGame._competition;
	const year = new Date(latestGame.date).getFullYear();
	const tableData = await processLeagueTableData(_competition, year);

	res.send({ _competition, year, ...tableData, loaded: new Date() });
}

export async function processLeagueTableData(segmentId, year, options = {}, forMinMaxTable = false) {
	//Work out default toDate
	let toDate;
	const now = new Date();
	if (year == now.getFullYear()) {
		toDate = now.toString("yyyy-MM-dd HH:mm:ss");
	} else {
		toDate = `${Number(year) + 1}-01-01 00:00:00`;
	}

	//Set default options
	options = {
		fromDate: `${year}-01-01 00:00:00`,
		toDate,
		...options
	};

	//Fix dates for aggregation
	options.fromDate = new Date(options.fromDate);
	options.toDate = new Date(options.toDate);

	//Validate Segment
	const segments = await Segment.aggregate([
		{
			$match: { _id: mongoose.Types.ObjectId(segmentId), type: "League" }
		},
		{
			$unwind: "$instances"
		},
		{
			$match: { "instances.year": parseInt(year) }
		},
		{
			$lookup: {
				from: "competitions",
				localField: "_parentCompetition",
				foreignField: "_id",
				as: "_parentCompetition"
			}
		},
		{
			$unwind: "$_parentCompetition"
		},
		{
			$project: {
				_id: 1,
				type: 1,
				name: 1,
				appendCompetitionName: 1,
				_parentCompetition: {
					name: 1
				},
				_pointsCarriedFrom: 1,
				instance: "$instances"
			}
		}
	]);

	if (!segments.length) {
		//Something has gone wrong, so we do one more lookup to see what it is
		const errorCheckSegment = await Segment.findById(segmentId, "_id type").lean();
		if (!errorCheckSegment) {
			return { error: `No segment with the id '${segmentId}' was found` };
		} else if (errorCheckSegment.type !== "League") {
			return { error: "Segment must be of type 'League'" };
		} else {
			return { error: `No instance for ${year}` };
		}
	}

	//Pull off necessary info
	const { instance } = segments[0];

	//Get settings
	const { customStyling, image, leagueTableColours, usesWinPc, totalRounds } = instance;
	const settings = {
		customStyling,
		image,
		usesWinPc,
		title: [year, instance.sponsor, getSegmentBasicTitle(segments[0])].filter(_.identity).join(" ")
	};
	if (forMinMaxTable) {
		settings.totalRounds = totalRounds;
		settings.leagueTableColours = leagueTableColours;
	}

	//Convert leagueTableColours to object
	const leagueTableColoursByRow = _.chain(leagueTableColours)
		.map(({ position, className }) => position.map(p => [p, className]))
		.flatten()
		.fromPairs()
		.value();

	//Get team names and image
	//For minmax also get colours
	let teamSelectString = "name images";
	if (forMinMaxTable) {
		teamSelectString += " colours";
	}

	//Get Date Filter
	const date = { $gte: options.fromDate, $lte: options.toDate };

	//Work out all competitions we need games for
	const competitions = [segmentId];

	let segmentToLoop = segments[0];
	while (segmentToLoop._pointsCarriedFrom) {
		//Push this entry to the array
		competitions.push(segmentToLoop._pointsCarriedFrom);

		segmentToLoop = await Segment.findById(segmentToLoop._pointsCarriedFrom, "_pointsCarriedFrom").lean();
	}

	//Define match param for local games
	const localGameMatch = {
		date,
		squadsAnnounced: true,
		_competition: { $in: competitions.map(id => mongoose.Types.ObjectId(id)) }
	};
	//Also handle scoreOverride games
	const localGameWithScoreOverrideMatch = {
		date,
		_competition: { $in: competitions },
		squadsAnnounced: false,
		"scoreOverride.1": { $exists: true }
	};
	//Define match param for neutral games
	const neutralGameMatch = {
		date,
		_competition: { $in: competitions },
		homePoints: { $ne: null },
		awayPoints: { $ne: null }
	};
	//Get teams and games
	let [teams, localGames, localGameWithScoreOverride, neutralGames] = await Promise.all([
		Team.find({ _id: { $in: instance.teams } }, teamSelectString).lean(),
		getGamesByAggregate(localGameMatch),
		Game.find(localGameWithScoreOverrideMatch, "_opposition isAway scoreOverride").lean(),
		NeutralGame.find(neutralGameMatch, "_homeTeam _awayTeam homePoints awayPoints").lean()
	]);
	teams = _.keyBy(teams, "_id");

	//Standardise game array
	//First, handle normal local games
	const games = localGames.map(g => {
		const _opposition = Object.keys(g.score).find(id => id !== localTeam);
		const _homeTeam = g.isAway ? _opposition : localTeam;
		const _awayTeam = g.isAway ? localTeam : _opposition;
		return {
			_homeTeam,
			_awayTeam,
			homePoints: g.score[_homeTeam],
			awayPoints: g.score[_awayTeam]
		};
	});

	//Then, add games with a scoreOverride
	for (const game of localGameWithScoreOverride) {
		//Ensure we don't already have this game as part of
		//localGames. Shouldn't be possible but no harm in checking
		if (localGames.find(g => g._id == game._id)) {
			continue;
		}
		const score = _.fromPairs(game.scoreOverride.map(({ _team, points }) => [_team, points]));
		const _opposition = Object.keys(score).find(id => id !== localTeam);
		const _homeTeam = game.isAway ? _opposition : localTeam;
		const _awayTeam = game.isAway ? localTeam : _opposition;
		games.push({
			_homeTeam,
			_awayTeam,
			homePoints: score[_homeTeam],
			awayPoints: score[_awayTeam]
		});
	}

	//Finally, add neutral games
	games.push(
		...neutralGames.map(g => ({
			...g,
			_homeTeam: g._homeTeam.toString(),
			_awayTeam: g._awayTeam.toString()
		}))
	);

	//Get sorting logic
	let tableSorting;
	if (instance.usesWinPc) {
		tableSorting = [
			["WinPc", "DiffPc"],
			["desc", "desc", "asc"]
		];
	} else {
		tableSorting = [
			["Pts", "Diff", "DiffPc"],
			["desc", "desc", "desc"]
		];
	}

	//Loop through teams and get data from games
	const rowData = _.chain(instance.teams)
		.map(team => {
			//Add Team ID to object
			//We set pts here so we can include pts adjustments,
			//whilst also calculating points based on W, L & D adjustments
			const row = { team, W: 0, D: 0, L: 0, F: 0, A: 0, Pts: 0 };

			//Loop Games
			games
				.filter(g => g._homeTeam == team || g._awayTeam == team)
				.forEach(g => {
					let thisTeamsPoints, oppositionPoints;

					if (g._homeTeam == team) {
						thisTeamsPoints = g.homePoints;
						oppositionPoints = g.awayPoints;
					} else {
						thisTeamsPoints = g.awayPoints;
						oppositionPoints = g.homePoints;
					}

					//Add points
					row.F += thisTeamsPoints;
					row.A += oppositionPoints;

					//Add result
					if (thisTeamsPoints > oppositionPoints) {
						row.W += 1;
					} else if (thisTeamsPoints < oppositionPoints) {
						row.L += 1;
					} else {
						row.D += 1;
					}
				});

			//Get adjustments
			const adjustments = instance.adjustments && instance.adjustments.find(a => a._team.toString() == team);
			if (adjustments) {
				for (const key in adjustments) {
					//We explicitly declare the keys below, as simply
					//doing something like if(row[key]) will pass in a bunch
					//of mongodb methods that then become part of the payload
					if (["W", "D", "L", "F", "A", "Pts"].includes(key)) {
						row[key] += adjustments[key];
					}
				}
			}

			//Calculate Diff, Pld, Pts & WinPC
			row.Pld = row.W + row.D + row.L;
			row.Diff = row.F - row.A;
			row.DiffPc = row.A ? (row.F / row.A) * 100 : 0;
			row.Pts += row.W * 2 + row.D;

			if (row.Pld === 0) {
				row.WinPc = 0;
			} else {
				row.WinPc = (row.Pts / row.Pld) * 50;
			}

			//Return Row
			return row;
		})
		.orderBy(...tableSorting)
		.map((row, i) => {
			//Get position
			row.position = i + 1;

			//Get Classname
			row.className = leagueTableColoursByRow[row.position];

			//Use classname to determine image variant we need
			const imageVariant = row.className ? "light" : "dark";

			//Replace team id with team object
			row.team = teams[row.team];

			//Only return the image that we need
			//We keep it as a nested image so we can more easily put it into <TeamImage />
			const image = row.team.images[imageVariant] || row.team.images.main;
			row.team.images = { main: image };

			return row;
		})
		.value();

	return { rowData, settings };
}

//Graphics
async function generateCompetitionInstanceImage(imageType, segment, instance, res) {
	switch (imageType) {
		case "leagueTable":
			return new LeagueTable(segment._id, instance.year, [localTeam]);
		case "minMaxTable":
			return new MinMaxLeagueTable(segment._id, instance.year, [localTeam]);
		default: {
			res.status(400).send(`Invalid imageType specified: ${imageType}`);
		}
	}
}

export async function fetchCompetitionInstanceImage(req, res) {
	const { _segment, _instance, imageType } = req.params;

	//Validate segment
	const segment = await validateSegment(_segment, res);
	if (segment) {
		//Validate instance
		const instance = await validateInstance(segment, _instance);
		if (instance) {
			//Get Image
			const image = await generateCompetitionInstanceImage(imageType, segment, instance, res);
			if (image) {
				const output = await image.render(false);
				res.send(output);
			}
		}
	}
}

export async function postCompetitionInstanceImage(req, res) {
	const { _segment, _instance } = req.params;
	const { imageType, _profile, content, replyTweet, channels } = req.body;

	//Validate segment
	const segment = await validateSegment(_segment, res);
	if (segment) {
		//Validate instance
		const instance = await validateInstance(segment, _instance);
		if (instance) {
			//Get Twitter Client for uploading images
			const twitterClient = await twitter(_profile);

			//Get Base64 Image
			const image = await generateCompetitionInstanceImage(imageType, segment, instance, res);
			if (image) {
				const media_data = await image.render(true);

				//Upload to twitter
				const upload = await twitterClient.post("media/upload", {
					media_data
				});

				//Get Media Id String
				const { media_id_string } = upload.data;
				const media_ids = [media_id_string];

				//Post Tweet
				let postedTweet, tweetError;
				try {
					postedTweet = await twitterClient.post("statuses/update", {
						status: content,
						in_reply_to_status_id: replyTweet,
						auto_populate_reply_metadata: true,
						tweet_mode: "extended",
						media_ids
					});
				} catch (e) {
					tweetError = e;
				}

				if (tweetError) {
					res.status(tweetError.statusCode).send(`(Twitter) - ${tweetError.message}`);
					return;
				}

				//Post to Facebook
				if (channels.find(c => c == "facebook")) {
					const tweetMediaObject = postedTweet.data.entities.media;
					const images = tweetMediaObject.map(t => t.media_url);
					await postToSocial("facebook", content, { _profile, images });
				}
			}
			res.send({});
		}
	}
}
