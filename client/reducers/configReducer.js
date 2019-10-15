import { FETCH_CURRENT_USER, GET_CORE_CONFIG, LOGOUT, TRANSFER_SITE_OWNER } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_CURRENT_USER:
			return { ...state, authUser: action.payload || false };

		case TRANSFER_SITE_OWNER:
			return { ...state, authUser: { ...state.authUser, isSiteOwner: false } };

		case LOGOUT:
			return { ...state, authUser: false };

		case GET_CORE_CONFIG:
			return { ...state, ...action.payload };

		default:
			return state;
	}
}
