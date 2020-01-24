//Modules
import _ from "lodash";
import { OAuth } from "oauth";

//Mongoose
import mongoose from "mongoose";
const Settings = mongoose.model("settings");

//Services
import twitter from "~/services/twitter";

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
						const user = await client.get("account/verify_credentials");
						if (user && user.data) {
							data = _.pick(user.data, [
								"name",
								"screen_name",
								"id_str",
								"profile_image_url_https"
							]);
							break;
						}
					} catch (e) {
						console.error(e);
					}
				}
			}

			if (data) {
				results[service] = { ...data, access_token: keys.access_token };
			} else {
				delete req.session.oAuthAccounts[service];
			}
		}
		req.session.save();
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
				res.status(error.statusCode).send(
					`${error.data}<br/><br/>Callback URL: ${client._authorize_callback}`
				);
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
		client.getOAuthAccessToken(
			oauth_token,
			null,
			oauth_verifier,
			(err, access_token, access_token_secret) => {
				if (err) {
					console.error(err);
				} else {
					if (!req.session.oAuthAccounts) {
						req.session.oAuthAccounts = {};
					}
					req.session.oAuthAccounts[service] = { access_token, access_token_secret };
					req.session.save();
				}

				//Return confirmation
				res.send("<script>window.close()</script>");
			}
		);
	}
}

export async function disconnect(req, res) {
	const { service } = req.params;
	delete req.session.oAuthAccounts[service];
	req.session.save();

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
				for (const media_data of options.images) {
					const upload = await client.post("media/upload", {
						media_data
					});
					media_ids.push(upload.data.media_id_string);
				}
			}
			if (options.media_strings && options.media_strings.length) {
				media_ids.push(...options.media_strings);
			}

			//Post Tweet
			let postedTweet, error;
			try {
				postedTweet = await client.post("statuses/update", {
					status: text,
					in_reply_to_status_id: options.replyTweet,
					auto_populate_reply_metadata: true,
					tweet_mode: "extended",
					media_ids
				});
			} catch (e) {
				error = e;
			}

			if (error) {
				return { success: false, error };
			} else {
				return { success: true, post: postedTweet.data };
			}
		}
	}
}
