import {
	FETCH_SOCIAL_PROFILES,
	FETCH_SOCIAL_PROFILE,
	DELETE_SOCIAL_PROFILE,
	SET_DEFAULT_SOCIAL_PROFILE
} from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_SOCIAL_PROFILES:
			return { ...state, profiles: action.payload };

		case FETCH_SOCIAL_PROFILE:
			return {
				...state,
				profiles: {
					...state.profiles,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_SOCIAL_PROFILE:
			const { [action.payload]: oldId, ...profiles } = state.profiles;
			return { ...state, profiles };

		case SET_DEFAULT_SOCIAL_PROFILE:
			return {
				...state,
				defaultProfile: action.payload
			};

		default:
			return state;
	}
}
