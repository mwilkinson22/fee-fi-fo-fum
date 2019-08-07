//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "sponsors";
const Sponsor = mongoose.model(collectionName);

//Helpers
import { getDirectoryList } from "~/helpers/fileHelper";

async function validateSponsor(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const sponsor = await Sponsor.findById(_id);
	if (sponsor) {
		return sponsor;
	} else {
		res.status(404).send(`No sponsor found with id ${_id}`);
		return false;
	}
}

export async function createSponsor(req, res) {
	const sponsor = new Sponsor(req.body);
	await sponsor.save();
	res.send(sponsor);
}

export async function getSponsors(req, res) {
	const sponsors = await Sponsor.find({}).lean();
	res.send(_.keyBy(sponsors, "_id"));
}

export async function updateSponsor(req, res) {
	const { _id } = req.params;
	const sponsor = await validateSponsor(_id, res);
	if (sponsor) {
		await sponsor.updateOne(req.body);
		const newSponsor = await Sponsor.findById(_id).lean();
		res.send(newSponsor);
	}
}

export async function deleteSponsor(req, res) {
	const { _id } = req.params;
	const sponsor = await validateSponsor(_id, res);
	if (sponsor) {
		const Person = mongoose.model("people");
		const players = await Person.find({ _sponsor: _id }, "name").lean();
		if (players.length) {
			let error = `Sponsor cannot be deleted as it is required for ${players.length} ${
				players.length == 1 ? "player" : "players"
			}`;

			res.status(409).send({
				error,
				toLog: { players }
			});
		} else {
			await sponsor.remove();
			res.send({});
		}
	}
}

export async function getSponsorLogos(req, res) {
	const imageList = await getDirectoryList("images/sponsors/");
	res.send(imageList);
}
