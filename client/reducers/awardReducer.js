import _ from "lodash";
import { FETCH_CURRENT_AWARDS, FETCH_AWARDS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_CURRENT_AWARDS:
			return {
				...state,
				currentAwards: action.payload
			};

		case FETCH_AWARDS:
			return {
				...state,
				awardsList: _.mapValues(action.payload, award => {
					return {
						...award,
						votingBegins: new Date(award.votingBegins),
						votingEnds: new Date(award.votingEnds)
					};
				})
			};

		default:
			return state;
	}
}
