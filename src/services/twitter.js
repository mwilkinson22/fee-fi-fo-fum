import _ from "lodash";
import { TwitterApi } from "twitter-api-v2";
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
	return new TwitterApi({
		appKey: consumer_key,
		appSecret: consumer_secret,
		accessToken: access_token,
		accessSecret: access_token_secret
	});
};
