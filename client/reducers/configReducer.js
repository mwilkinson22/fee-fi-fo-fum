import { GET_CORE_CONFIG } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case GET_CORE_CONFIG:
			return { ...state, ...action.payload };
		default:
			return state;
	}
}
