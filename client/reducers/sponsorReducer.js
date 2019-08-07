import {
	CREATE_SPONSOR,
	DELETE_SPONSOR,
	FETCH_SPONSOR_LOGOS,
	FETCH_SPONSORS,
	UPDATE_SPONSOR
} from "../actions/types";
import { fixFiles } from "~/helpers/adminHelper";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_SPONSORS:
			return {
				...state,
				sponsorList: action.payload
			};

		case CREATE_SPONSOR:
		case UPDATE_SPONSOR:
			return {
				...state,
				sponsorList: {
					...state.sponsorList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_SPONSOR:
			const { [action.payload]: oldId, ...sponsorList } = state.sponsorList;
			return {
				...state,
				sponsorList
			};

		case FETCH_SPONSOR_LOGOS:
			return {
				...state,
				sponsorLogos: fixFiles(action.payload)
			};

		default:
			return state;
	}
}
