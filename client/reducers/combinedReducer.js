import { combineReducers } from "redux";
import { reducer as reduxForm } from "redux-form";
import authReducer from "./authReducer";
import competitionReducer from "./competitionReducer";
import configReducer from "./configReducer";
import gamesReducer from "./gamesReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";
import peopleReducer from "./peopleReducer";
import seasonReducer from "./seasonReducer";

export default combineReducers({
	auth: authReducer,
	competitions: competitionReducer,
	config: configReducer,
	form: reduxForm,
	games: gamesReducer,
	news: newsReducer,
	people: peopleReducer,
	seasons: seasonReducer,
	teams: teamsReducer
});
