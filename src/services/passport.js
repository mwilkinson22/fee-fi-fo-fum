const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");

const User = mongoose.model("users");

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id).then(user => {
		done(null, user);
	});
});

passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username }, (err, user) => {
			if (err) return done(err);
			if (!user || !user.validatePassword(password)) return done(null, false);

			return done(null, user);
		});
	})
);
