import _ from "lodash";
import Twitter from "twit";
import mongoose from "mongoose";
const Settings = mongoose.model("settings");
const SocialProfile = mongoose.model("socialProfiles");

export default async (_profile, keys = null) => {
	//Get the app data
	const app = await Settings.find(
		{
			name: { $in: ["twitter_consumer_key", "twitter_consumer_secret"] }
		},
		"name value"
	).lean();

	const { consumer_key, consumer_secret } = _.chain(app)
		.keyBy(({ name }) => name.replace("twitter_", ""))
		.mapValues("value")
		.value();

	//Get the user data
	let accessKeys;
	if (_profile) {
		const profile = await SocialProfile.findById(_profile).lean();
		accessKeys = profile.twitter;
	} else if (keys) {
		//Sometimes the access token data will be prefixed
		//with twitter_, so we provisionally remove that
		accessKeys = _.chain(keys)
			.map((value, name) => [name.replace("twitter_", ""), value])
			.fromPairs()
			.value();
	}
	const { access_token, access_token_secret } = accessKeys;

	//Get Client
	const client = new Twitter({
		consumer_key,
		consumer_secret,
		access_token,
		access_token_secret
	});

	return client;
};
