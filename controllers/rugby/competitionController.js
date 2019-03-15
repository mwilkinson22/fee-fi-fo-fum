//Mongoose
import mongoose from "mongoose";
const Competition = mongoose.model("competitions");
const CompetitionSegment = mongoose.model("competitionSegments");

export async function getSegments(req, res) {
	const competitions = await CompetitionSegment.find({}).populate("_parentCompetition");
	res.send(competitions);
}

export async function getCompetitions(req, res) {
	const competitions = await Competition.find({}).lean();
	res.send(competitions);
}
