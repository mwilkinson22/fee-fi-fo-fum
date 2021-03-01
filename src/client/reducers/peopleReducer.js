import _ from "lodash";
import { DELETE_PERSON, FETCH_PEOPLE_LIST, FETCH_PERSON, FETCH_PEOPLE, ADD_PERSON_SLUG } from "../actions/types";

function fixDates(person) {
	if (person.dateOfBirth) {
		person.dateOfBirth = new Date(person.dateOfBirth);
	}

	if (person.additionalCoachStats) {
		person.additionalCoachStats = person.additionalCoachStats.map(s => {
			s.from = new Date(s.from);
			if (s.to) {
				s.to = new Date(s.to);
			}
			return s;
		});
	}
}

export default function(state = { fullPeople: {}, slugMap: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			fixDates(action.payload);
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload },
				peopleList: { ...state.peopleList, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE:
			_.mapValues(action.payload, fixDates);
			return {
				...state,
				fullPeople: {
					...state.fullPeople,
					...action.payload
				}
			};

		case ADD_PERSON_SLUG: {
			return {
				...state,
				slugMap: {
					...state.slugMap,
					...action.payload
				}
			};
		}

		case FETCH_PEOPLE_LIST:
			return { ...state, peopleList: action.payload };

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
