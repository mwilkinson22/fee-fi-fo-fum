import {
	FETCH_GAMES,
	UPDATE_GAME_BASICS,
	SET_PREGAME_SQUADS,
	FETCH_GAME_LIST,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES
} from "../actions/types";
import { fixDates } from "../../helpers/gameHelper";

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

		case FETCH_NEUTRAL_GAMES:
			return {
				...state,
				neutralGames: action.payload
			};

		case CRAWL_LOCAL_GAMES:
			return {
				...state,
				crawledLocalGames: action.payload
			};

		case CRAWL_NEUTRAL_GAMES:
			return {
				...state,
				crawledNeutralGames: action.payload
			};

		default:
			return state;
	}
}
