import {
	CREATE_SPONSOR,
	DELETE_SPONSOR,
	FETCH_PEOPLE_LIST,
	FETCH_PERSON,
	FETCH_SPONSOR_LOGOS,
	FETCH_SPONSORS,
	UPDATE_SPONSOR
} from "./types";
import { toast } from "react-toastify";

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

export const setExternalNames = values => async (dispatch, getState, api) => {
	await api.put(`/people/setExternalNames`, values);
	toast.success(`External names for ${values.length} people updated`);
	return true;
};

//Player Sponsors
export const createPlayerSponsor = data => async (dispatch, getState, api) => {
	const res = await api.post(`/people/sponsors`, data);
	dispatch({ type: CREATE_SPONSOR, payload: res.data });
	toast.success("Sponsor Created");
	return res.data._id;
};

export const fetchPlayerSponsors = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people/sponsors`);
	dispatch({ type: FETCH_SPONSORS, payload: res.data });
};

export const updatePlayerSponsor = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/people/sponsors/${id}`, data);
	dispatch({ type: UPDATE_SPONSOR, payload: res.data });
	toast.success("Sponsor Updated");
};

export const deletePlayerSponsor = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/people/sponsors/${id}`);
	dispatch({ type: DELETE_SPONSOR, payload: res.data });
	toast.success("Sponsor Deleted");
	return true;
};

export const fetchAllSponsorLogos = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people/sponsorLogos`);
	dispatch({ type: FETCH_SPONSOR_LOGOS, payload: res.data });
};
