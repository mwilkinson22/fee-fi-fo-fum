const express = require("express");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const passport = require("passport");
const bodyParser = require("body-parser");
const keys = require("./config/keys");

//Add Mongoose Models
require("./models/User");
require("./models/IdLink");
require("./models/SlugRedirect");
require("./models/rugby");
require("./models/NewsPost");

mongoose.connect(
	keys.mongoURI,
	{
		useNewUrlParser: true,
		useCreateIndex: true
	}
);

const app = express();

//Enable bodyParser
app.use(bodyParser.json());

//Set up passport
require("./services/passport");
app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
);
app.use(passport.initialize());
app.use(passport.session());

// API Routes
require("./routes/usersRoutes")(app);
require("./routes/rugby")(app);
require("./routes/newsRoutes")(app);

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
