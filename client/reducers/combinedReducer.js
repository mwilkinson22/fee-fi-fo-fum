import { combineReducers } from "redux";
import competitionReducer from "./competitionReducer";
import configReducer from "./configReducer";
import gamesReducer from "./gamesReducer";
import groundReducer from "./groundReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";
import peopleReducer from "./peopleReducer";
import seasonReducer from "./seasonReducer";
import userReducer from "./userReducer";

export default combineReducers({
	competitions: competitionReducer,
	config: configReducer,
	games: gamesReducer,
	grounds: groundReducer,
	news: newsReducer,
	people: peopleReducer,
	seasons: seasonReducer,
	teams: teamsReducer,
	users: userReducer
});
