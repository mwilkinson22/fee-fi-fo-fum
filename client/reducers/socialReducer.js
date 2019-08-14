import {
	FETCH_SOCIAL_PROFILES,
	FETCH_SOCIAL_PROFILE,
	DELETE_SOCIAL_PROFILE
} from "../actions/types";

export default function(state = null, action) {
	switch (action.type) {
		case FETCH_SOCIAL_PROFILES:
			return action.payload;

		case FETCH_SOCIAL_PROFILE:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case DELETE_SOCIAL_PROFILE:
			const { [action.payload]: oldId, ...socialProfiles } = state;
			return socialProfiles;

		default:
			return state;
	}
}
