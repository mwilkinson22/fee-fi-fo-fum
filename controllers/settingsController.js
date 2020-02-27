//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "settings";
const Settings = mongoose.model(collectionName);

export async function ensureRequiredSettingsAreSet() {
	//Each key is a setting name, matched a boolean that governs the
	//requireAdminToView property
	const requiredSettings = {
		twitter_consumer_key: false,
		twitter_consumer_secret: true,
		twitter_access_token: true,
		twitter_access_token_secret: true,
		site_name: false,
		site_social: false,
		site_logo: false,
		site_header_logo: false,
		site_default_description: false
	};

	//Get all current settings loaded in
	const settings = await Settings.find({}).lean();

	//Create bulk operations array
	const bulkOperations = _.chain(requiredSettings)
		.map((requireAdminToView, name) => {
			if (!settings.find(s => s.name == name)) {
				return { insertOne: { document: { name, requireAdminToView, value: "" } } };
			}
		})
		.filter(_.identity)
		.value();

	if (bulkOperations.length) {
		await Settings.bulkWrite(bulkOperations);
	}
}

export async function getSettings(req, res) {
	const { names } = req.params;
	const settings = await Settings.find({ name: { $in: names.split(",") } }).lean();

	//Ensure the user is authorised to view everything
	const adminOnlySettings = settings.filter(s => s.requireAdminToView);
	if (adminOnlySettings.length && !req.user.isAdmin) {
		res.status(403).send(
			`Only admins can view ${adminOnlySettings.map(s => s.name).join(", ")}`
		);
	} else {
		const results = _.chain(settings)
			.keyBy("name")
			.mapValues("value")
			.value();

		res.send(results);
	}
}

export async function setSettings(req, res) {
	const bulkOperations = _.map(req.body, (value, name) => ({
		updateOne: {
			filter: { name },
			update: { value },
			upsert: true
		}
	}));

	await Settings.bulkWrite(bulkOperations);

	res.send({});
}
