import {
	FETCH_GAMES,
	UPDATE_GAME,
	FETCH_GAME_LIST,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES,
	DELETE_NEUTRAL_GAME
} from "../actions/types";
import { fixDates } from "../../helpers/gameHelper";

export default function(state = { fullGames: {} }, action) {
	if (!action || !action.payload) {
		return state;
	}

	switch (action.type) {
		case FETCH_GAMES:
			return {
				...state,
				fullGames: {
					...state.fullGames,
					...fixDates(action.payload)
				}
			};

		case UPDATE_GAME:
			return {
				...state,
				fullGames: {
					...state.fullGames,
					...fixDates(action.payload.fullGames)
				},
				gameList: {
					...fixDates(action.payload.gameList)
				},
				slugMap: {
					...action.payload.slugMap
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
				neutralGames: fixDates(action.payload)
			};

		case UPDATE_NEUTRAL_GAMES:
			return {
				...state,
				neutralGames: {
					...state.neutralGames,
					...fixDates(action.payload)
				}
			};

		case DELETE_NEUTRAL_GAME:
			const { [action.payload]: removed, ...neutralGames } = state.neutralGames;
			return {
				...state,
				neutralGames
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
