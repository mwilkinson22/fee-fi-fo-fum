import {
	FETCH_GROUND,
	DELETE_GROUND,
	FETCH_ALL_GROUNDS,
	FETCH_GROUND_IMAGES
} from "../actions/types";

import { fixFiles } from "~/helpers/adminHelper";
export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_GROUND_IMAGES:
			return {
				...state,
				headerImages: fixFiles(action.payload)
			};

		case FETCH_ALL_GROUNDS:
			return {
				...state,
				...action.payload
			};

		case FETCH_GROUND:
			return {
				...state,
				groundList: {
					...state.groundList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_GROUND:
			const { [action.payload]: oldId, ...groundList } = state.groundList;
			return {
				...state,
				groundList
			};
		default:
			return state;
	}
}
