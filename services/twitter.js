import Twitter from "twit";
import mongoose from "mongoose";
const SocialProfile = mongoose.model("socialProfiles");

export default async (_profile, keys = null) => {
	if (!keys) {
		const profile = await SocialProfile.findById(_profile).lean();
		keys = profile.twitter;
	}
	const client = new Twitter(keys);
	return client;
};
