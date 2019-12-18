//Mongoose
import mongoose from "mongoose";
const Error = mongoose.model("errors");

export async function getErrors(req, res) {
	//30 days ago
	const date = new Date().addDays(-30);

	//Generate query
	const query = { date: { $gte: date } };

	//Unless instructed otherwise, filter by archived status
	if (!req.query.includeArchived) {
		query.archived = false;
	}

	const errors = await Error.find(query).populate("_user");
	res.send(errors);
}

export async function postError(req, res) {
	//Get IP Address
	const forwarded = req.headers["x-forwarded-for"];
	const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;

	//Save error
	const error = new Error({ ...req.body, ip });
	error.save();

	res.send(error._id);
}

export async function unarchiveError(req, res) {
	const { _id } = req.params;

	await Error.findOneAndUpdate({ _id }, { archived: false });

	await getErrors(req, res);
}

export async function archiveError(req, res) {
	const { _id } = req.params;

	await Error.findOneAndUpdate({ _id }, { archived: true });

	await getErrors(req, res);
}

export async function archiveAllErrors(req, res) {
	await Error.updateMany({}, { archived: true }, { multi: true });

	await getErrors(req, res);
}
