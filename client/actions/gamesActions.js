import { FETCH_GAMES, FETCH_GAME_LIST, UPDATE_GAME, CRAWL_LOCAL_GAMES } from "./types";
import { toast } from "react-toastify";
import _ from "lodash";

export const fetchGames = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const reloadGames = ids => async (dispatch, getState, api) => {
	const deleters = _.chain(ids)
		.map(id => [id, undefined])
		.fromPairs()
		.value();
	dispatch({ type: FETCH_GAMES, payload: deleters });
	const res = await api.get(`/games/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
	toast.success(`${ids.length} games refreshed`);
};

export const fetchGameList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games`);
	dispatch({ type: FETCH_GAME_LIST, payload: res.data });
};

export const addGame = values => async (dispatch, getState, api) => {
	const res = await api.post(`/games/`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	return res.data.fullGames[res.data.id];
};

export const updateGameBasics = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/basics/`, values);
	toast.success("Game updated");
	await dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const setPregameSquads = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/pregame/`, values);
	toast.success("Squads saved");
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const setSquad = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/squad/`, values);
	toast.success("Squad saved");
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const markSquadAsAnnounced = (id, announced) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/squadsAnnounced`, { announced });
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const postGameEvent = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/`, values);
	if (res.data) {
		dispatch({ type: UPDATE_GAME, payload: res.data });
		if (values.postTweet) {
			toast.success("Tweet Sent");
		} else {
			toast.success("Game Updated");
		}

		const event = _.orderBy(res.data.fullGames[id].events, ["date"], ["desc"])[0];
		return event;
	} else {
		return false;
	}
};

export const crawlGame = (id, includeScoringStats) => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/crawl?includeScoringStats=${includeScoringStats}`);
	return res.data;
};

export const setStats = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/stats`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Stats saved");
};

export const setMotm = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/motm`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Man of the Match saved");
};

export const setManOfSteelPoints = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/manOfSteel`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Man of Steel points saved");
};

export const deleteGameEvent = (id, event, params) => async (dispatch, getState, api) => {
	const query = _.map(params, (val, key) => `${key}=${val.toString()}`).join("&");
	const res = await api.delete(`/games/${id}/event/${event}?${query}`);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Event deleted");
	return res.data.fullGames[id].events;
};

export const crawlLocalGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_LOCAL_GAMES, payload: res.data });
};

export const getPregameImage = (id, query = "") => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/images/pregame${query}`);
	return res.data;
};

export const getSquadImage = (id, showOpposition) => async (dispatch, getState, api) => {
	const res = await api.get(
		`/games/${id}/images/squad?showOpposition=${showOpposition.toString()}`
	);
	return res.data;
};

export const previewPlayerEventImage = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/imagePreview`, values);
	return res.data;
};

export const getGameSocialMediaImage = id => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/images/social`);
	return res.data;
};
