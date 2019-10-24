import _ from "lodash";
import { FETCH_CURRENT_AWARDS, FETCH_AWARDS, FETCH_AWARD, DELETE_AWARD } from "../actions/types";

const fixDates = award => ({
	...award,
	votingBegins: new Date(award.votingBegins),
	votingEnds: new Date(award.votingEnds)
});

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_CURRENT_AWARDS:
			//Here
			console.log(action.payload);
			return {
				...state,
				currentAwards: action.payload
			};

		case FETCH_AWARDS:
			return {
				...state,
				awardsList: _.mapValues(action.payload, fixDates)
			};

		case FETCH_AWARD:
			return {
				...state,
				awardsList: {
					...state.awardsList,
					[action.payload._id]: fixDates(action.payload)
				}
			};

		case DELETE_AWARD: {
			const { [action.payload]: oldId, ...awardsList } = state.awardsList;
			return {
				...state,
				awardsList
			};
		}

		default:
			return state;
	}
}
