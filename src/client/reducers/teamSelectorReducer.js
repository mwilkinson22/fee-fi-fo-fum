import _ from "lodash";
import { FETCH_TEAM_SELECTOR, FETCH_TEAM_SELECTOR_LIST, DELETE_TEAM_SELECTOR } from "../actions/types";

import { teamSelectors as listProperties } from "~/constants/listProperties";

export default function(state = { selectors: {}, haveLoadedAll: false }, action) {
	switch (action.type) {
		case FETCH_TEAM_SELECTOR: {
			return {
				...state,
				selectors: {
					...state.selectors,
					[action.payload._id]: action.payload
				},
				selectorList: {
					...state.selectorList,
					[action.payload._id]: _.pick(action.payload, listProperties)
				}
			};
		}

		case FETCH_TEAM_SELECTOR_LIST: {
			return {
				...state,
				selectorList: action.payload,
				haveLoadedAll: true
			};
		}

		case DELETE_TEAM_SELECTOR: {
			const { [action.payload]: oldId, ...selectorList } = state.selectorList;
			const { [action.payload]: oldId2, ...selectors } = state.selectors;
			return {
				...state,
				selectorList,
				selectors
			};
		}

		default:
			return state;
	}
}
