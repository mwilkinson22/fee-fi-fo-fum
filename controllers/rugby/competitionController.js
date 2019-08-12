//Modules
import _ from "lodash";

//Mongoose
import mongoose from "mongoose";
const Competition = mongoose.model("competitions");
const CompetitionSegment = mongoose.model("competitionSegments");

export async function getCompetitions(req, res) {
	const competitions = await Competition.find({}).lean();
	res.send(_.keyBy(competitions, "_id"));
}

export async function getSegments(req, res) {
	const segments = await CompetitionSegment.find({}).populate("_parentCompetition");
	res.send(_.keyBy(segments, "_id"));
}
