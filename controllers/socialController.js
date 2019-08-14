//Modules
import _ from "lodash";

//Mongoose
import mongoose from "mongoose";
const SocialProfile = mongoose.model("socialProfiles");

//Helpers
import twitter from "~/services/twitter";

async function validateProfile(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const profile = await SocialProfile.findById(_id);
	if (profile) {
		return profile;
	} else {
		res.status(404).send(`No social profile found with id ${_id}`);
		return false;
	}
}

export async function createProfile(req, res) {
	const profile = new SocialProfile(req.body);
	await profile.save();

	res.send(profile);
}

export async function getProfiles(req, res) {
	const profiles = await SocialProfile.find().lean();

	res.send(_.keyBy(profiles, "_id"));
}

export async function updateProfile(req, res) {
	const { _id } = req.params;
	const profile = await validateProfile(_id, res);
	if (profile) {
		await profile.updateOne(req.body);
		const updatedProfile = await SocialProfile.findById(_id).lean();
		res.send(updatedProfile);
	}
}

export async function deleteProfile(req, res) {
	const { _id } = req.params;
	const profile = await validateProfile(_id, res);
	if (profile) {
		await profile.remove();
		res.send({});
	}
}

export async function twitterTest(req, res) {
	const twitterClient = await twitter(null, req.body);
	let error, result;
	try {
		result = await twitterClient.get("account/settings");
	} catch (e) {
		error = e;
	}
	if (error) {
		res.send({
			authenticated: false,
			error
		});
	} else {
		res.send({
			authenticated: true,
			user: result.data.screen_name
		});
	}
}
