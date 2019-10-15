//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const User = mongoose.model("users");

//Helpers
async function validateUser(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const user = await User.findById(_id).noPassword();
	if (user) {
		return user;
	} else {
		res.status(404).send(`No user found with id ${_id}`);
		return false;
	}
}

function processBasics(values) {
	return _.mapValues(values, (val, key) => {
		if (val === "") {
			return null;
		} else if (key === "password") {
			return User.generateHash(val);
		} else {
			return val;
		}
	});
}

//Getters
export async function getUser(req, res) {
	const { id } = req.params;
	const user = await User.findById(id).noPassword();
	if (user) {
		res.send(user);
	} else {
		res.status(404).send(`User '${id}' does not exist`);
	}
}

export async function getUserList(req, res) {
	const users = await User.find({}).noPassword();
	res.send(_.keyBy(users, "_id"));
}

//Setters
export async function createUser(req, res) {
	const values = processBasics(req.body);
	const user = new User(values);
	await user.save();

	req.params.id = user._id;
	await getUser(req, res);
}

//Putters
export async function updateUser(req, res) {
	const { id } = req.params;
	const user = await validateUser(id, res);
	if (user) {
		const values = processBasics(req.body);
		await user.updateOne(values);
		await getUser(req, res);
	}
}

export async function transferSiteOwner(req, res) {
	const { id } = req.params;
	const user = await validateUser(id, res);
	if (user) {
		await User.updateMany({}, { isSiteOwner: false }, { multi: true });
		await user.updateOne({ isSiteOwner: true });
		await getUserList(req, res);
	}
}

//Deleters
export async function deleteUser(req, res) {
	const { id } = req.params;
	const user = await validateUser(id, res);
	if (id == req.user._id) {
		res.status(403).send("Cannot delete yourself");
	} else if (user && user.isSiteOwner) {
		res.status(403).send("Cannot delete site owner");
	} else if (user) {
		const Game = mongoose.model("games");
		const games = await Game.find({ "events._user": id }, "slug").lean();

		const NewsPost = mongoose.model("newsPosts");
		const posts = await NewsPost.find({ _author: id }, "slug").lean();

		if (games.length || posts.length) {
			let error = "User cannot be deleted, as they have posted ";

			if (posts.length) {
				error += `${posts.length} ${posts.length === 1 ? "article" : "articles"}`;
				if (games.length) {
					error += " & ";
				}
			}

			if (games.length) {
				error += `events in ${games.length} ${games.length === 1 ? "game" : "games"}`;
			}

			res.status(409).send({
				error,
				toLog: { games, posts }
			});
		} else {
			await user.remove();
			res.send({});
		}
	}
}

//Auth
export async function currentUser(req, res) {
	res.send(req.user);
}

export async function logout(req, res) {
	req.logout();
	res.send({});
}
