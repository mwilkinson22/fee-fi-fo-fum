const express = require("express");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const passport = require("passport");
const keys = require("./config/keys");
// require("./models/User");

// require("./services/passport");

mongoose.connect(keys.mongoURI);

const app = express();

app.get("/", (req, res) => {
	res.send("Hi");
});

/*app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
)
app.use(passport.initialize());
app.use(passport.session());

*/
if (process.env.NODE_ENV === "production") {
	//Express will serve up production assets like main.js or main.css
	app.use(express.static("client/build"));

	//Express will serve up index.html file if it doesn't recognise the route
	const path = require("path");
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
	});
}

const PORT = process.env.PORT || 5000;
app.listen(PORT);
