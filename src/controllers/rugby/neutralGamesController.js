//Mongoose
import mongoose from "mongoose";
const NeutralGame = mongoose.model("neutralGames");

//Modules
import _ from "lodash";

//Helpers
import { parseExternalGame } from "~/helpers/gameHelper";

function queryGenerator(year) {
	return {
		date: { $gte: `${year}-01-01`, $lte: `${Number(year) + 1}-01-01` }
	};
}

//Getters
export async function getList(req, res) {
	const { year } = req.params;
	const games = await NeutralGame.find(queryGenerator(year));
	res.send(_.keyBy(games, "_id"));
}

export async function getListFromId(req, res) {
	const { _id } = req.params;
	const game = await NeutralGame.findById(_id);
	if (game) {
		const year = new Date(game.date).getFullYear();
		const games = await NeutralGame.find(queryGenerator(year));
		res.send({ year, games: _.keyBy(games, "_id") });
	} else {
		res.status(404).send(`Game with id '${_id}' not found`);
	}
}

export async function getYears(req, res) {
	const aggregatedYears = await NeutralGame.aggregate([
		{ $project: { _id: 0, year: { $year: "$date" } } },
		{ $group: { _id: "$year" } }
	]);
	const years = aggregatedYears
		.map(({ _id }) => _id)
		.sort()
		.reverse();
	res.send(years);
}

export async function getUpdatedNeutralGames(ids, res) {
	//To be called after post/put methods
	const games = await NeutralGame.find({ _id: { $in: ids } }).lean();

	//First, create a nested object of games grouped by year
	const gamesByYear = _.chain(games)
		.groupBy(g => new Date(g.date).getFullYear())
		.mapValues(games => _.keyBy(games, "_id"))
		.value();

	//Look for any deleted games
	const deleted = ids.filter(id => !games.find(g => g._id == id));

	const result = {
		...gamesByYear,
		deleted
	};

	if (res) {
		res.send(result);
	} else {
		return result;
	}
}

//Setters
export async function createNeutralGames(req, res) {
	const bulkOperation = _.map(req.body, document => {
		return {
			insertOne: { document }
		};
	});
	const newGames = await NeutralGame.bulkWrite(bulkOperation);
	await getUpdatedNeutralGames(_.values(newGames.insertedIds), res);
}

export async function updateGames(req, res) {
	const bulkOperation = _.map(req.body, (data, _id) => {
		if (data.delete) {
			return {
				deleteOne: {
					filter: { _id }
				}
			};
		} else {
			return {
				updateOne: {
					filter: { _id },
					update: data
				}
			};
		}
	});
	if (bulkOperation.length > 0) {
		await NeutralGame.bulkWrite(bulkOperation);
		await getUpdatedNeutralGames(Object.keys(req.body), res);
	} else {
		res.send({});
	}
}

export async function deleteGame(req, res) {
	const { _id } = req.params;
	await NeutralGame.deleteOne({ _id: req.params });
	res.send(_id);
}

//External Getters
export async function crawlAndUpdateGame(req, res) {
	const { _id } = req.params;
	const query = { _id };
	await crawlAndUpdateGames(query, res);
}
export async function crawlAndUpdateRecent(req, res) {
	await crawlAndUpdateGames(
		{
			externalSync: true,
			date: {
				$gt: new Date().addDays(-30),
				$lte: new Date().addHours(-2)
			},
			$or: [{ homePoints: null }, { awayPoints: null }]
		},
		res
	);
}

async function crawlAndUpdateGames(query, res) {
	const games = await NeutralGame.find(
		{ ...query, externalId: { $ne: null } },
		"_id externalId _competition"
	).populate({
		path: "_competition",
		select: "_parentCompetition externalCompId externalDivId",
		populate: {
			path: "_parentCompetition",
			select: "webcrawlFormat"
		}
	});

	const values = {};

	for (const game of games) {
		const results = await parseExternalGame(game, true);
		if (results && !results.error) {
			values[game._id] = results;
		}
	}
	await updateGames({ body: values }, res);
}
