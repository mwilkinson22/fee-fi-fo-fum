import {
	FETCH_GAMES,
	UPDATE_GAME,
	DELETE_GAME,
	FETCH_GAME_LIST,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES,
	DELETE_NEUTRAL_GAME,
	FETCH_NEUTRAL_GAME_YEARS,
	SAVE_FAN_POTM_VOTE
} from "../actions/types";

//Helpers
import { fixDates, getNeutralGame } from "../../helpers/gameHelper";

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
				redirects: {
					...action.payload.redirects
				}
			};

		case DELETE_GAME: {
			const { [action.payload]: oldGame, ...fullGames } = state.fullGames;
			const { [action.payload]: oldInList, ...gameList } = state.gameList;
			return {
				...state,
				fullGames,
				gameList
			};
		}

		case FETCH_GAME_LIST:
			fixDates(action.payload.gameList);
			return {
				...state,
				...action.payload
			};

		case FETCH_NEUTRAL_GAME_YEARS:
			return {
				...state,
				neutralGameYears: action.payload
			};
		case FETCH_NEUTRAL_GAMES:
			return {
				...state,
				neutralGames: {
					...state.neutralGames,
					[action.year]: fixDates(action.payload)
				}
			};

		case UPDATE_NEUTRAL_GAMES: {
			//We get an object back with year keys and possibly a "deleted" key
			//First we pull off the deleted object
			const { deleted, ...gamesByYear } = action.payload;

			//Then we create a base object, based on the current neutralGames state
			const neutralGames = { ...state.neutralGames };

			//Then we loop through all current games to make sure we remove
			//any deleted ones
			if (deleted) {
				for (const year in neutralGames) {
					deleted.forEach(id => delete neutralGames[year][id]);
				}
			}

			//Then, loop through each year and add it to the object
			for (const year in gamesByYear) {
				const currentValues = neutralGames[year] || {};

				neutralGames[year] = {
					...currentValues,
					...fixDates(gamesByYear[year])
				};
			}

			//Finally, push this to the state
			return {
				...state,
				neutralGames
			};
		}

		case DELETE_NEUTRAL_GAME: {
			//Get Year
			const game = getNeutralGame(action.payload, state.neutralGames);
			const year = game.date.getFullYear();

			//Extract Game
			const { [action.payload]: removed, ...remainingGames } = state.neutralGames[year];

			//Return State
			return {
				...state,
				neutralGames: {
					...state.neutralGames,
					[year]: remainingGames
				}
			};
		}

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

		case SAVE_FAN_POTM_VOTE: {
			const { gameId, choice } = action.payload;
			return {
				...state,
				fullGames: {
					...state.fullGames,
					[gameId]: {
						...state.fullGames[gameId],
						activeUserFanPotmVote: choice
					}
				}
			};
		}

		default:
			return state;
	}
}