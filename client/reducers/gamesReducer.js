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
	switch (action.type) {
		case FETCH_GAMES:
			fixDates(action.payload);
			return {
				...state,
				fullGames: {
					...state.fullGames,
					...action.payload
				}
			};

		case UPDATE_GAME:
			fixDates(action.payload.fullGames);
			fixDates(action.payload.gameList);
			return {
				...state,
				fullGames: {
					...state.fullGames,
					...action.payload.fullGames
				},
				gameList: {
					...action.payload.gameList
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
			fixDates(action.payload);
			return {
				...state,
				neutralGames: action.payload
			};

		case UPDATE_NEUTRAL_GAMES:
			fixDates(action.payload);
			return {
				...state,
				neutralGames: {
					...state.neutralGames,
					...action.payload
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
