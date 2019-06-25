//Modules
import mongoose from "mongoose";

//Mongoose
const User = mongoose.model("users");

//Getters
export async function getUser(req, res) {
	const { id } = req.params;
	const user = await User.findById(id);
	if (user) {
		res.send(user);
	} else {
		res.status(404).send(`User '${id}' does not exist`);
	}
}

export async function getUserList(req, res) {
	const users = await User.find({}).forList();
	res.send(users);
}

//Setters
export async function createNewUser(req, res) {
	const { username, password, email, firstName, lastName } = req.body;
	const user = new User({
		username,
		email,
		name: {
			first: firstName,
			last: lastName
		}
	});

	user.password = user.generateHash(password);
	user.save();
	res.send({});
}

//Auth
export async function currentUser(req, res) {
	res.send(req.user);
}

export async function logout(req, res) {
	req.logout();
	res.send({});
}
