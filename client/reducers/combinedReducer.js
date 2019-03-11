import { combineReducers } from "redux";
import { reducer as reduxForm } from "redux-form";
import competitionReducer from "./competitionReducer";
import configReducer from "./configReducer";
import gamesReducer from "./gamesReducer";
import groundReducer from "./groundReducer";
import teamsReducer from "./teamsReducer";
import newsReducer from "./newsReducer";
import peopleReducer from "./peopleReducer";
import seasonReducer from "./seasonReducer";

export default combineReducers({
	competitions: competitionReducer,
	config: configReducer,
	form: reduxForm,
	games: gamesReducer,
	grounds: groundReducer,
	news: newsReducer,
	people: peopleReducer,
	seasons: seasonReducer,
	teams: teamsReducer
});
