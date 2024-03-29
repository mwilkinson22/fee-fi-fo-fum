//Modules
import _ from "lodash";
import axios from "axios";
import { OAuth } from "oauth";
import { EUploadMimeType } from "twitter-api-v2";

//Mongoose
import mongoose from "mongoose";
const Person = mongoose.model("people");
const User = mongoose.model("users");
const Settings = mongoose.model("settings");
const SocialProfile = mongoose.model("socialProfiles");

//Services
import twitter from "~/services/twitter";
import { urlRegex } from "~/constants/regex";

//Helpers
async function getOAuthClient(req, res, service) {
	//Get Callback
	const oauth_callback = `${req.protocol}://${req.get("host")}/api/oauth/${service}/callback`;

	switch (service) {
		case "twitter": {
			//Get client info
			let settings = await Settings.find({
				name: { $in: ["twitter_consumer_key", "twitter_consumer_secret"] }
			}).lean();
			settings = _.chain(settings)
				.keyBy("name")
				.mapValues("value")
				.value();

			return new OAuth(
				"https://api.twitter.com/oauth/request_token",
				"https://api.twitter.com/oauth/access_token",
				settings.twitter_consumer_key,
				settings.twitter_consumer_secret,
				"1.0",
				oauth_callback,
				"HMAC-SHA1"
			);
		}

		default:
			res.status(404).send(`Invalid service: ${service}`);
	}
}

//Getters
export async function getAuthorisedAccounts(req, res) {
	const { oAuthAccounts } = req.session;
	const { secret } = req.query;

	if (!oAuthAccounts) {
		res.send({});
	} else {
		const results = {};

		//Convert token + secret values to frontend data
		for (const service in oAuthAccounts) {
			//Get token + secret
			const keys = oAuthAccounts[service];

			//Values to return
			let client, data;
			switch (service) {
				case "twitter": {
					try {
						client = await twitter(null, keys);
						const user = await client.v1.verifyCredentials();
						if (user) {
							data = _.pick(user, ["name", "screen_name", "id_str", "profile_image_url_https"]);
							break;
						}
					} catch (e) {
						console.error(e);
					}
				}
			}

			if (data) {
				results[service] = { ...data, access_token: keys.access_token };

				//We allow the token secret to be sent for Admin users, when associating
				//twitter details
				if (secret && req.user && req.user.isAdmin) {
					results[service].access_token_secret = keys.access_token_secret;
				}
			} else {
				delete req.session.oAuthAccounts[service];
			}
		}
		res.send(results);
	}
}
export async function authoriseService(req, res) {
	const { service } = req.params;

	//Get client
	const client = await getOAuthClient(req, res, service);

	//Get URL
	let authUrl;
	switch (service) {
		case "twitter":
			authUrl = token => `https://api.twitter.com/oauth/authorize?oauth_token=${token}`;
			break;

		default:
			res.status(500).send("No auth url provided");
	}

	if (client && authUrl) {
		//Try to get token
		client.getOAuthRequestToken((error, token) => {
			if (error) {
				res.status(error.statusCode).send(`${error.data}<br/><br/>Callback URL: ${client._authorize_callback}`);
			} else {
				res.redirect(authUrl(token));
			}
		});
	}
}

export async function callback(req, res) {
	const { service } = req.params;
	const { oauth_token, oauth_verifier } = req.query;

	const client = await getOAuthClient(req, res, service);

	if (client) {
		client.getOAuthAccessToken(oauth_token, null, oauth_verifier, (err, access_token, access_token_secret) => {
			if (err) {
				console.error(err);
			} else {
				if (!req.session.oAuthAccounts) {
					req.session.oAuthAccounts = {};
				}
				req.session.oAuthAccounts[service] = { access_token, access_token_secret };
			}

			//Return confirmation
			res.send("<script>window.close()</script>");
		});
	}
}

export async function disconnect(req, res) {
	const { service } = req.params;
	delete req.session.oAuthAccounts[service];

	await getAuthorisedAccounts(req, res);
}

export async function postToSocial(service, text, options = {}) {
	if (!options._profile && !options.keys) {
		return { success: false, error: "Social Profile ID or Keys must be included" };
	}
	switch (service) {
		case "twitter": {
			//Only one of these options will be required
			const client = await twitter(options._profile, options.keys);

			//First, upload the images
			const media_ids = [];
			if (options.images && options.images.length) {
				for (const mediaData of options.images) {
					const mediaIdString = await client.v1.uploadMedia(mediaData, { mimeType: EUploadMimeType.Jpeg });
					media_ids.push(mediaIdString);
				}
			}
			if (options.media_strings && options.media_strings.length) {
				media_ids.push(...options.media_strings);
			}

			//Post Tweet

			try {
				const tweetSettings = { text };
				if (options.replyTweet) {
					tweetSettings.reply = {
						in_reply_to_tweet_id: options.replyTweet
					};
				}

				if (media_ids && media_ids.length) {
					tweetSettings.media = { media_ids };
				}

				const postedTweet = await client.v2.tweet(tweetSettings);

				return { success: true, post: postedTweet.data };
			} catch (error) {
				return { success: false, error };
			}
		}

		case "facebook": {
			// IFTTT seems to be broken. Temporarily disabling Facebook posting.
			// Using a bool to stop "unreachable code" error in IDE
			const iftttBroken = true;
			if (iftttBroken) return;

			//Get Profile
			const profile = await SocialProfile.findById(options._profile).lean();

			//Get core info
			let event = "facebook";
			const data = {
				value1: text.replace(/\n/g, "<br>")
			};

			//Replace @'s with names, where possible
			const twitterHandles = text.match(/@[A-Z0-9-_]+/gi);
			if (twitterHandles) {
				//Get people with corresponding handles
				const people = await Person.find(
					{
						twitter: { $in: twitterHandles.map(h => h.replace("@", "")) }
					},
					"twitter name nickname"
				).lean();

				//Get users with corresponding handles
				const users = await User.find(
					{
						twitter: { $in: twitterHandles.map(h => h.replace("@", "")) }
					},
					"twitter name frontendName"
				).lean();

				//Combine users + people into single object
				const twitterAccounts = [];
				people.forEach(({ twitter, name, nickname }) =>
					twitterAccounts.push({
						twitter,
						name: nickname || name.last
					})
				);
				users.forEach(({ twitter, name, frontendName }) =>
					twitterAccounts.push({
						twitter,
						name: frontendName || name.full
					})
				);

				//Loop through and update text
				twitterAccounts.forEach(({ name, twitter }) => {
					data.value1 = data.value1.replace(new RegExp(`@${twitter}`, "gi"), name);
				});
			}

			//Add image
			if (options.images && options.images.length) {
				event += "_with_photo";
				data.value2 = options.images[0];
			}
			//If there's no image, check for a link
			else {
				event += "_with_link";
				const matches = data.value1.match(urlRegex);
				if (matches && matches.length === 1) {
					const [url] = matches;
					data.value1 = data.value1.replace(url, "").trim();
					data.value2 = url;
				}
			}

			//Submit
			await axios.post(`https://maker.ifttt.com/trigger/${event}/with/key/${profile.iftttKey}`, data);
		}
	}
}
