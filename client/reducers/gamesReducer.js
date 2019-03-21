import _ from "lodash";
import {
	FETCH_GAMES,
	UPDATE_GAME_BASICS,
	SET_PREGAME_SQUADS,
	FETCH_GAME_LIST
} from "../actions/types";

function fixDates(games) {
	return _.mapValues(games, game => {
		game.date = new Date(game.date);
		return game;
	});
}

export default function(state = { fullGames: {} }, action) {
	switch (action.type) {
		case FETCH_GAMES:
		case UPDATE_GAME_BASICS:
		case SET_PREGAME_SQUADS:
			fixDates(action.payload);
			return {
				...state,
				fullGames: {
					...state.fullGames,
					...action.payload
				}
			};

		case FETCH_GAME_LIST:
			fixDates(action.payload.gameList);
			return {
				...state,
				...action.payload
			};

		default:
			return state;
	}
}
