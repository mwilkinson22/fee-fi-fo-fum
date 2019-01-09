import { FETCH_SQUAD, FETCH_YEARS_WITH_SQUADS } from "../actions/types";
import _ from "lodash";

export default function(state = { squads: {} }, action) {
	switch (action.type) {
		case FETCH_SQUAD:
			let { players } = action.payload;
			if (process.env.NODE_ENV === "production" && action.payload.year === 2019) {
				//TODO remove once squadnumbers are announced
				players = _.map(players, player => {
					player.number = null;
					return player;
				});
			}
			return {
				...state,
				squads: { ...state.squads, [action.payload.year]: players }
			};
		case FETCH_YEARS_WITH_SQUADS:
			return {
				...state,
				years: action.payload
			};
		default:
			return state;
	}
}
