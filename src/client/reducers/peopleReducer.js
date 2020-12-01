import _ from "lodash";
import { DELETE_PERSON, FETCH_PEOPLE_LIST, FETCH_PERSON, FETCH_PEOPLE } from "../actions/types";

function fixDateOfBirth(person) {
	if (person.dateOfBirth) {
		person.dateOfBirth = new Date(person.dateOfBirth);
	}
}

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			fixDateOfBirth(action.payload);
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload },
				peopleList: { ...state.peopleList, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE:
			_.mapValues(action.payload, fixDateOfBirth);
			return {
				...state,
				fullPeople: {
					...state.fullPeople,
					...action.payload
				}
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

		case DELETE_PERSON: {
			const { [action.payload]: oldFull, ...fullPeople } = state.fullPeople;
			const { [action.payload]: oldList, ...peopleList } = state.peopleList;
			return {
				...state,
				fullPeople,
				peopleList
			};
		}

		default:
			return state;
	}
}
