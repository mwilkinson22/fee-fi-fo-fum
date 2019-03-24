import { FETCH_PEOPLE_LIST, FETCH_PERSON } from "./types";

export const fetchPeopleList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people`);
	dispatch({ type: FETCH_PEOPLE_LIST, payload: res.data });
};

export const fetchPerson = id => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/people/${id}`).catch(e => {
		switch (e.response.status) {
			case 307:
			case 308:
				payload = { ...e.response.data, redirect: true };
				break;
			case 404:
				payload = false;
				break;
		}
	});

	//Handle retrieved player
	if (payload === undefined) {
		payload = res.data;
	}

	dispatch({ type: FETCH_PERSON, payload });
};
