import { combineReducers } from "redux";
import { reducer as reduxForm } from "redux-form";
import authReducer from "./authReducer";
import gameReducer from "./gamesReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";

export default combineReducers({
	auth: authReducer,
	form: reduxForm,
	games: gameReducer,
	news: newsReducer,
	teams: teamsReducer
});
