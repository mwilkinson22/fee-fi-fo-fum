import { DELETE_PERSON, FETCH_PEOPLE_LIST, FETCH_PERSON } from "../actions/types";

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			if (action.payload.dateOfBirth) {
				action.payload.dateOfBirth = new Date(action.payload.dateOfBirth);
			}
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload },
				peopleList: { ...state.peopleList, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

		case DELETE_PERSON:
			const { [action.payload]: oldFull, ...fullPeople } = state.fullPeople;
			const { [action.payload]: oldList, ...peopleList } = state.peopleList;
			return {
				...state,
				fullPeople,
				peopleList
			};

		default:
			return state;
	}
}
