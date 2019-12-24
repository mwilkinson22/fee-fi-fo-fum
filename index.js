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
import "./models/Award";
import "./models/Error";
import "./models/IdLink";
import "./models/TeamSelector";
import "./models/rugby";
import "./models/SocialProfile";
import "./models/SlugRedirect";
import "./models/Sponsor";
import "./models/NewsPost";
import "./models/User";

//Frontend
import Routes from "./client/Routes";
import "./client/scss/styles.scss";

//Actions
import { fetchCurrentAwards } from "./client/actions/awardActions";
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
import awardRoutes from "./routes/awardRoutes";
import errorRoutes from "./routes/errorRoutes";
import fileRoutes from "./routes/fileRoutes";
import newsRoutes from "./routes/newsRoutes";
import rugbyRoutes from "./routes/rugby";
import socialRoutes from "./routes/socialRoutes";
import teamSelectorRoutes from "./routes/teamSelectorRoutes";
import usersRoutes from "./routes/usersRoutes";

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
app.use((req, res, done) => {
	const forwarded = req.headers["x-forwarded-for"];
	req.ipAddress = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
	done();
});

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
awardRoutes(app);
errorRoutes(app);
fileRoutes(app);
newsRoutes(app);
rugbyRoutes(app);
socialRoutes(app);
teamSelectorRoutes(app);
usersRoutes(app);
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
	await store.dispatch(fetchCurrentAwards(req.ipAddress));

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
