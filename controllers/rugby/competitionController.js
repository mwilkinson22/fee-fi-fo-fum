//Modules
import _ from "lodash";

//Mongoose
import mongoose from "mongoose";
const Competition = mongoose.model("competitions");
const Segment = mongoose.model("competitionSegments");
const Game = mongoose.model("games");
const NeutralGames = mongoose.model("neutralGames");

//Helpers
function getGameQuery(_competition, year = null) {
	const query = { _competition };
	if (year) {
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: new Date(`${year + 1}-01-01`)
		};
	}
	return query;
}
async function validateCompetition(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
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
		res.status(400).send(`No segment id provided`);
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
		res.status(400).send(`No instance id provided`);
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
						gameCheck = instance.teams.filter(id => !req.body.teams.find(t => t == id))
							.length;
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
					const query = getGameQuery(
						segmentId,
						segment.multipleInstances && instance.year
					);
					const games = await Game.find(
						{ ...query, _opposition: { $nin: req.body.teams } },
						"slug _opposition"
					).lean();
					const neutralGames = await NeutralGames.find(
						{
							...query,
							$or: [
								{ _homeTeam: { $nin: req.body.teams } },
								{ _awayTeam: { $nin: req.body.teams } }
							]
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
				await Segment.updateOne(
					{ _id: segmentId, "instances._id": instanceId },
					{ $set: updateObject }
				);
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
			const neutralGames = await NeutralGames.find(query, "_id");

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
