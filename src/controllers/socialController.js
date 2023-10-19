//Modules
import _ from "lodash";

//Mongoose
import mongoose from "mongoose";
const SocialProfile = mongoose.model("socialProfiles");

//Helpers
import twitter from "~/services/twitter";
import { postToSocial } from "./oAuthController";

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

	await SocialProfile.updateMany({}, { $unset: { "twitter.consumer_key": true, "twitter.consumer_secret": true } });

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
			errors.push(`it is required for tweets in ${games.length} ${games.length == 1 ? "game" : "games"}`);
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

export async function validateTwitterCredentials(req, res) {
	const twitterClient = await twitter(null, req.body);
	let error, result;
	try {
		result = await twitterClient.v1.verifyCredentials();
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
			user: result.screen_name
		});
	}
}

export async function simpleSocialPost(req, res) {
	const { channels, _profile, content, replyTweet } = req.body;

	for (const channel of channels) {
		await postToSocial(channel, content, { _profile, replyTweet });
	}

	res.send({});
}

export async function simpleSocialThreadPost(req, res) {
	let { channels, _profile, posts, replyTweet, joinForFacebook } = req.body;

	for (const channel of channels) {
		if (channel === "facebook" && joinForFacebook) {
			const content = posts.map(p => p.content).join("\n\n");
			await postToSocial(channel, content, { _profile });
		} else {
			for (const post of posts) {
				const result = await postToSocial(channel, post.content, {
					_profile,
					replyTweet
				});

				//Update reply tweet
				if (channel === "twitter" && result.success) {
					replyTweet = result.post.id_str;
				}
			}
		}
	}

	res.send({});
}
