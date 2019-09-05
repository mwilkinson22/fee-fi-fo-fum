import { DELETE_PERSON, FETCH_PEOPLE_LIST, FETCH_PERSON } from "./types";
import { toast } from "react-toastify";

export const fetchPeopleList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people`);
	dispatch({ type: FETCH_PEOPLE_LIST, payload: res.data });
};

export const createPerson = data => async (dispatch, getState, api) => {
	const res = await api.post(`/people/`, data);
	dispatch({ type: FETCH_PERSON, payload: res.data });
	toast.success("Person created");
	return res.data.slug;
};

export const updatePerson = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/people/${id}`, data);
	dispatch({ type: FETCH_PERSON, payload: res.data });
	toast.success("Person Updated");
};

export const deletePerson = (id, onSuccess) => async (dispatch, getState, api) => {
	const res = await api.delete(`/people/${id}`);
	if (res.data) {
		await onSuccess();
		dispatch({ type: DELETE_PERSON, payload: id });
		toast.success(`Person deleted`);
		return true;
	}
	return false;
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
