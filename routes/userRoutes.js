const passport = require("passport");
const mongoose = require("mongoose");
const User = mongoose.model("users");

module.exports = app => {
	//Create New User
	app.post("/api/users", (req, res) => {
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
	});

	//Get existing user
	app.get("/api/users/:username", async (req, res) => {
		const user = await User.findOne({ username: req.params.username });
		if (user) {
			res.send(user);
		} else {
			res.status(400).send(
				`User '${req.params.username}' does not exist`
			);
		}
	});

	//Login
	app.post("/auth/login", passport.authenticate("local"), (req, res) => {
		res.redirect("/admin");
	});
	//Logout
	app.get("/api/logout", (req, res) => {
		req.logout();
		res.redirect("/");
	});

	app.get("/api/current_user", (req, res) => {
		res.send(req.user);
	});
};
