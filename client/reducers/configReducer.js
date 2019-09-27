import { FETCH_USER, GET_CORE_CONFIG, LOGOUT, SET_SOCIAL_MEDIA_IMAGE } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_USER:
			return { ...state, authUser: action.payload || false };

		case LOGOUT:
			return { ...state, authUser: false };

		case GET_CORE_CONFIG:
			return { ...state, ...action.payload };

		case SET_SOCIAL_MEDIA_IMAGE:
			return { ...state, socialMediaImage: action.payload };

		default:
			return state;
	}
}
