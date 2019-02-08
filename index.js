import "babel-polyfill";
import express from "express";
import { matchRoutes } from "react-router-config";
import Routes from "./client/Routes";
import renderer from "./helpers/renderer";
import createStore from "./helpers/createStore";

import mongoose from "mongoose";
import cookieSession from "cookie-session";
import passport from "passport";
import bodyParser from "body-parser";
import keys from "./config/keys";

//Add Mongoose Models
import "./models/User";
import "./models/IdLink";
import "./models/SlugRedirect";
import "./models/rugby";
import "./models/NewsPost";

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
import "./services/passport";
app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
);
app.use(passport.initialize());
app.use(passport.session());

import "./client/scss/styles.scss";

//Set up static routes
app.use(express.static("public"));

// API Routes
require("./routes/usersRoutes")(app);
require("./routes/rugby")(app);
require("./routes/newsRoutes")(app);

//Render
app.get("*", (req, res) => {
	const store = createStore(req);

	const promises = matchRoutes(Routes, req.path)
		.map(({ route }) => {
			const promise = route.loadData ? route.loadData(store, req.path) : null;
			return promise;
		})
		.map(promise => {
			if (promise) {
				return new Promise(resolve => {
					promise.then(resolve).catch(resolve);
				});
			}
		});

	Promise.all(promises).then(() => {
		const context = {};
		const content = renderer(req, store, context);

		if (context.url) {
			return res.redirect(301, context.url);
		}

		if (context.notFound) {
			res.status(404);
		}

		res.send(content);
	});
});
export const PORT = process.env.PORT || 3000;
app.listen(PORT);
