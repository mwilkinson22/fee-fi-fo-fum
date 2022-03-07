import {
	DELETE_COMPETITION,
	DELETE_COMPETITION_SEGMENT,
	FETCH_ALL_COMPETITION_SEGMENTS,
	FETCH_ALL_COMPETITIONS,
	FETCH_COMPETITION,
	FETCH_COMPETITION_SEGMENT,
	FETCH_HOMEPAGE_LEAGUE_TABLE_DATA,
	FETCH_LEAGUE_TABLE_DATA
} from "./types";
import { toast } from "react-toastify";
import { createLeagueTableString } from "~/helpers/competitionHelper";

export const fetchCompetitions = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions");
	// noinspection JSUnresolvedVariable
	dispatch({ type: FETCH_ALL_COMPETITIONS, payload: res.data });
};

export const createCompetition = data => async (dispatch, getState, api) => {
	const res = await api.post("/competitions", data);
	dispatch({ type: FETCH_COMPETITION, payload: res.data });
	toast.success(`Competition created`);
	return res.data._id;
};

export const updateCompetition = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/competitions/${id}`, data);
	dispatch({ type: FETCH_COMPETITION, payload: res.data });
	toast.success(`Competition updated`);
};

export const deleteCompetition = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/competitions/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_COMPETITION, payload: id });
		toast.success(`Competition deleted`);
		return true;
	}
};

export const fetchCompetitionSegments = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions/segments");
	dispatch({ type: FETCH_ALL_COMPETITION_SEGMENTS, payload: res.data });
};

export const createCompetitionSegment = data => async (dispatch, getState, api) => {
	const res = await api.post("/competitions/segments", data);
	dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
	toast.success(`Competition Segment created`);
	return res.data._id;
};

export const updateCompetitionSegment = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/competitions/segments/${id}`, data);
	dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
	toast.success(`Competition Segment updated`);
};

export const deleteCompetitionSegment = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/competitions/segments/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_COMPETITION_SEGMENT, payload: id });
		toast.success(`Competition Segment deleted`);
		return true;
	}
};

export const createCompetitionInstance = (segment, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/competitions/segments/${segment}/instance`, data);
	if (res.data) {
		dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data.segment });
		toast.success(`Competition Instance created`);
		return res.data.instanceId;
	}
};

export const updateCompetitionInstance = (segment, instance, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/competitions/segments/${segment}/instance/${instance}`, data);
	if (res.data) {
		dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
		toast.success(`Competition Instance updated`);
	}
};

export const deleteCompetitionInstance = (segment, instance) => async (dispatch, getState, api) => {
	const res = await api.delete(`/competitions/segments/${segment}/instance/${instance}`);
	if (res.data) {
		dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
		toast.success(`Competition Instance deleted`);
		return true;
	}
};

export const crawlNewFixtures = (segment, results) => async (dispatch, getState, api) => {
	const res = await api.get(`/competitions/segments/${segment}/crawlNewGames?results=${results ? 1 : 0}`);
	return res.data || false;
};

export const fetchInstanceImage = (segmentId, instanceId, imageType) => async (dispatch, getState, api) => {
	const res = await api.get(`/competitions/segments/${segmentId}/instance/${instanceId}/image/${imageType}`);

	if (res.data) {
		return res.data;
	}
};

export const postInstanceImage = (segmentId, instanceId, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/competitions/segments/${segmentId}/instance/${instanceId}/image/`, data);

	if (res.data) {
		return res.data;
	}
};

export const fetchLeagueTableData = (_competition, year, fromDate, toDate) => async (dispatch, getState, api) => {
	//Create root URL
	let url = `/competitions/leagueTableData/${_competition}/${year}`;

	//Add date params
	const dateFormat = "yyyy-MM-dd";
	const query = [];
	if (fromDate) {
		// noinspection JSCheckFunctionSignatures
		query.push(`fromDate=${fromDate.toString(dateFormat)}`);
	}
	if (toDate) {
		// noinspection JSCheckFunctionSignatures
		query.push(`toDate=${toDate.toString(dateFormat)}`);
	}
	if (query.length) {
		url += `?${query.join("&")}`;
	}
	const res = await api.get(url);

	if (res.data) {
		dispatch({
			type: FETCH_LEAGUE_TABLE_DATA,
			key: createLeagueTableString(_competition, year, fromDate, toDate),
			payload: res.data
		});
	}
};

export const fetchHomePageLeagueTableData = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions/leagueTableData/homePage");

	if (!res.data || !Object.keys(res.data).length) {
		//No league games found
		dispatch({ type: FETCH_HOMEPAGE_LEAGUE_TABLE_DATA, payload: false });
	} else {
		const { _competition, year, ...data } = res.data;
		const key = createLeagueTableString(_competition, year);
		//First update the league table data
		dispatch({ type: FETCH_LEAGUE_TABLE_DATA, key, payload: data });
		//Then define the key
		dispatch({ type: FETCH_HOMEPAGE_LEAGUE_TABLE_DATA, payload: { _competition, year } });
	}
};
