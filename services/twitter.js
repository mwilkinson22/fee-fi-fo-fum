import Twitter from "twit";
import mongoose from "mongoose";
const SocialProfile = mongoose.model("socialProfiles");

module.exports = async _profile => {
	const profile = await SocialProfile.findById(_profile).lean();
	const client = new Twitter(profile.twitter);
	return client;
};
