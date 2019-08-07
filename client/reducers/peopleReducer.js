import {
	CREATE_SPONSOR,
	DELETE_SPONSOR,
	FETCH_PEOPLE_LIST,
	FETCH_PERSON,
	FETCH_SPONSOR_LOGOS,
	FETCH_SPONSORS,
	UPDATE_SPONSOR
} from "../actions/types";
import { fixFiles } from "~/helpers/adminHelper";

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

		case FETCH_SPONSORS:
			return {
				...state,
				sponsors: action.payload
			};

		case CREATE_SPONSOR:
		case UPDATE_SPONSOR:
			return {
				...state,
				sponsors: {
					...state.sponsors,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_SPONSOR:
			const { [action.payload]: oldId, ...sponsors } = state.sponsors;
			return {
				...state,
				sponsors
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
