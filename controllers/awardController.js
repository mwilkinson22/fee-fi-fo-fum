//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const Award = mongoose.model("awards");

//Getters
export async function getCurrent(req, res) {
	const forwarded = req.headers["x-forwarded-for"];
	const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
	const now = new Date();
	let awards = await Award.find({
		votingBegins: {
			$lte: now
		},
		votingEnds: {
			$gte: now
		}
	}).lean();

	awards.map(award => {
		const { votes, ...data } = award;
		const hasVoted = Boolean(votes.find(vote => vote.ip === ip));
		return { ...data, hasVoted };
	});

	res.send(awards);
}

export async function getAwards(req, res) {
	const awards = await Award.find({}).lean();
	res.send(_.keyBy(awards, "_id"));
}
