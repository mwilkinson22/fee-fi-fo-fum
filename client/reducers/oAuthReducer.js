import { FETCH_OAUTH_ACCOUNTS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_OAUTH_ACCOUNTS:
			return {
				...state,
				authorisedAccounts: action.payload || {}
			};

		default:
			return state;
	}
}
