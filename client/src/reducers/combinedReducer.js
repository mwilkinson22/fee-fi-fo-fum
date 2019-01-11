import { combineReducers } from "redux";
import { reducer as reduxForm } from "redux-form";
import authReducer from "./authReducer";
import gamesReducer from "./gamesReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";
import peopleReducer from "./peopleReducer";
import statsReducer from "./statsReducer";

export default combineReducers({
	auth: authReducer,
	form: reduxForm,
	games: gamesReducer,
	news: newsReducer,
	people: peopleReducer,
	stats: statsReducer,
	teams: teamsReducer
});
