import { combineReducers } from "redux";
import awardReducer from "./awardReducer";
import broadcasterReducer from "./broadcasterReducer";
import competitionReducer from "./competitionReducer";
import configReducer from "./configReducer";
import errorReducer from "./errorReducer";
import gamesReducer from "./gamesReducer";
import locationReducer from "./locationReducer";
import groundReducer from "./groundReducer";
import oAuthReducer from "./oAuthReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";
import peopleReducer from "./peopleReducer";
import socialReducer from "./socialReducer";
import sponsorReducer from "./sponsorReducer";
import teamSelectorReducer from "./teamSelectorReducer";
import userReducer from "./userReducer";

export default combineReducers({
	awards: awardReducer,
	broadcasters: broadcasterReducer,
	competitions: competitionReducer,
	config: configReducer,
	errors: errorReducer,
	games: gamesReducer,
	grounds: groundReducer,
	locations: locationReducer,
	news: newsReducer,
	oAuth: oAuthReducer,
	people: peopleReducer,
	social: socialReducer,
	sponsors: sponsorReducer,
	teamSelectors: teamSelectorReducer,
	teams: teamsReducer,
	users: userReducer
});
