import { FETCH_GAME, FETCH_HOMEPAGE_GAMES, FETCH_GAMES, FETCH_GAME_LISTS } from "../actions/types";

export default function(state = { fullGames: {} }, action) {
	switch (action.type) {
		case FETCH_GAME:
			return {
				...state,
				fullGames: {
					...state.fullGames,
					[action.slug]: action.payload
				}
			};
		case FETCH_GAMES:
			const { year, teamType, games } = action.payload;
			return {
				...state,
				lists: {
					...state.lists,
					[year]: {
						...state.lists[year],
						[teamType]: {
							...state.lists[year][teamType],
							games
						}
					}
				}
			};

		case FETCH_GAME_LISTS:
			return {
				...state,
				lists: {
					...action.payload
				}
			};

		case FETCH_HOMEPAGE_GAMES:
			return { ...state, homepageGames: action.payload };

		default:
			return state;
	}
}
