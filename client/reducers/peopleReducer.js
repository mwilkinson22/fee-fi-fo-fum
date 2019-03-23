import _ from "lodash";
import {
	FETCH_ALL_REFEREES,
	FETCH_PEOPLE_LIST,
	FETCH_PERSON,
	FETCH_PLAYER_STAT_YEARS,
	FETCH_PLAYER_STATS
} from "../actions/types";

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

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
		case FETCH_ALL_REFEREES:
			return {
				...state,
				referees: action.payload
			};

		case FETCH_PLAYER_STATS:
			if (Object.keys(action.payload).length) {
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
			} else {
				return state;
			}

		default:
			return state;
	}
}
