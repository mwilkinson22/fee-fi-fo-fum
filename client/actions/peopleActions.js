import { FETCH_PEOPLE_LIST, FETCH_PERSON, FETCH_SPONSORS } from "./types";
import { toast } from "react-toastify";

export const fetchPeopleList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people`);
	dispatch({ type: FETCH_PEOPLE_LIST, payload: res.data });
};

export const fetchPlayerSponsors = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people/sponsors`);
	dispatch({ type: FETCH_SPONSORS, payload: res.data });
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

export const setExternalNames = values => async (dispatch, getState, api) => {
	await api.put(`/people/setExternalNames`, values);
	toast.success(`External names for ${values.length} people updated`);
	return true;
};
