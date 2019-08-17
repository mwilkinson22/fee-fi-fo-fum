//Modules
import _ from "lodash";

//Mongoose
import mongoose from "mongoose";
const SocialProfile = mongoose.model("socialProfiles");

//Helpers
import twitter from "~/services/twitter";

//Constants
import { defaultSocialProfile } from "~/config/keys";

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
		const Game = mongoose.model("games");
		const games = await Game.find({ events: { $elemMatch: { _profile: _id } } }, "slug");

		const errors = [];
		if (_id == defaultSocialProfile) {
			errors.push("it is the current default");
		}
		if (games.length) {
			errors.push(
				`it is required for tweets in ${games.length} ${
					games.length == 1 ? "game" : "games"
				}`
			);
		}

		if (errors.length) {
			const error = `Profile cannot be deleted as ${errors.join(" & ")}`;

			res.status(409).send({
				error,
				toLog: { games }
			});
		} else {
			await profile.remove();
			res.send({});
		}
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

export async function twitterAuth(req, res) {
	//Get Default App
	const twitterClient = await twitter(defaultSocialProfile);
	let a, e;
	try {
		a = await twitterClient.post("https://api.twitter.com/oauth/request_token", {
			oauth_consumer_key: twitterClient.config.consumer_key,
			oauth_callback: "https://fee-fi-fo-fum.herokuapp.com/api/twitter/callback"
		});
	} catch (err) {
		e = err;
	}
	console.log(e);
	// console.log(e.response);
	res.send(e);
}

export async function twitterCallback(req, res) {
	console.log(req.body);
	res.send(req.body);
}
