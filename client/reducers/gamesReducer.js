import {
	FETCH_GAMES,
	UPDATE_GAME,
	FETCH_GAME_LIST,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES,
	DELETE_NEUTRAL_GAME,
	FETCH_PREGAME_IMAGE
} from "../actions/types";
import { fixDates } from "../../helpers/gameHelper";

export default function(state = { fullGames: {}, images: { pregame: {} } }, action) {
	switch (action.type) {
		case FETCH_GAMES:
		case UPDATE_GAME:
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

		case FETCH_PREGAME_IMAGE:
			return {
				...state,
				images: {
					...state.images,
					pregame: {
						...state.images.pregame,
						[action.id]: action.payload
					}
				}
			};

		default:
			return state;
	}
}
