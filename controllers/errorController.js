//Mongoose
import mongoose from "mongoose";
const Error = mongoose.model("errors");

export async function getErrors(req, res) {
	const errors = await Error.find().lean();
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
