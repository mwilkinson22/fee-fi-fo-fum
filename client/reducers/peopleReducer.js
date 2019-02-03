import _ from "lodash";
import { FETCH_PERSON, FETCH_PLAYER_STAT_YEARS, FETCH_PLAYER_STATS } from "../actions/types";

export default function(state = { squads: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return { ...state, [action.payload.slug]: action.payload };

		case FETCH_PLAYER_STAT_YEARS:
			const playerStats = _.chain(action.payload.years)
				.keyBy()
				.mapValues(key => null)
				.value();
			return {
				...state,
				[action.payload.slug]: {
					...state[action.payload.slug],
					playerStats
				}
			};

		case FETCH_PLAYER_STATS:
			return {
				...state,
				[action.payload.slug]: {
					...state[action.payload.slug],
					playerStats: {
						...state[action.payload.slug].playerStats,
						[action.payload.year]: action.payload.games
					}
				}
			};

		default:
			return state;
	}
}
