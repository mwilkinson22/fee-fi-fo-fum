//Modules
import "@babel/polyfill";
import _ from "lodash";
import express from "express";
import compression from "compression";
import { matchRoutes } from "react-router-config";
import renderer from "./helpers/server/renderer";
import createStore from "./helpers/server/createStore";
import "datejs";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import passport from "passport";
import bodyParser from "body-parser";
import useragent from "express-useragent";

//Models
import "./models/User";
import "./models/SocialProfile";
import "./models/Sponsor";
import "./models/IdLink";
import "./models/SlugRedirect";
import "./models/rugby";
import "./models/NewsPost";

//Frontend
import Routes from "./client/Routes";
import "./client/scss/styles.scss";

//Actions
import { getCoreConfig } from "./client/actions/configActions";
import { setDefaultProfile } from "./client/actions/socialActions";
import { fetchCurrentUser } from "./client/actions/userActions";
import {
	fetchTeam,
	fetchAllTeamTypes,
	setActiveTeamType,
	fetchTeamList
} from "./client/actions/teamsActions";

//Constants
import keys from "./config/keys";

//Middlewares & Services
import requireHttps from "~/middlewares/requireHttps";
import "./services/passport";

//API Routes
import fileRoutes from "./routes/fileRoutes";
import usersRoutes from "./routes/usersRoutes";
import socialRoutes from "./routes/socialRoutes";
import rugbyRoutes from "./routes/rugby";
import newsRoutes from "./routes/newsRoutes";

//Configure Mongoose
mongoose.connect(keys.mongoURI, {
	useNewUrlParser: true,
	useCreateIndex: true
});

//Render App with middleware
const app = express();
app.use(bodyParser.json());
app.use(compression({ level: 9 }));
app.use(useragent.express());

//Set up passport
app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
);
app.use(passport.initialize());
app.use(passport.session());

//Set up static routes
app.use(express.static("public"));

// API Routes
fileRoutes(app);
usersRoutes(app);
socialRoutes(app);
rugbyRoutes(app);
newsRoutes(app);
app.all("/api*", (req, res) => {
	res.status("404").send("404 - Invalid API path");
});

//Require https for all frontend content
app.use(requireHttps);

//Render
app.get("*", async (req, res) => {
	const store = createStore(req);

	//Get Basic Config
	await store.dispatch(getCoreConfig(req));
	await store.dispatch(setDefaultProfile(keys.defaultSocialProfile));
	await store.dispatch(fetchCurrentUser());

	//Team Types
	await store.dispatch(fetchAllTeamTypes());
	const activeTeamType = _.chain(store.getState().teams.teamTypes)
		.sortBy("sortOrder")
		.value()[0]._id;
	await store.dispatch(setActiveTeamType(activeTeamType));

	//Get teams
	await store.dispatch(fetchTeamList());
	await store.dispatch(fetchTeam(keys.localTeam));

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

if (process.env.NODE_ENV !== "development") {
	require("./scheduledTasks");
}

export const PORT = process.env.PORT || 3000;
console.info("\x1b[32m", `Application started and listening on port ${PORT}`, "\x1b[0m");
app.listen(PORT);
