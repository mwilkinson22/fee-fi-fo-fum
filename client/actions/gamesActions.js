import {
	FETCH_GAMES,
	FETCH_GAME_LIST,
	UPDATE_GAME,
	CRAWL_LOCAL_GAMES,
	DELETE_GAME,
	SAVE_FAN_POTM_VOTE
} from "./types";
import { toast } from "react-toastify";
import _ from "lodash";

export const fetchGames = (ids, dataLevel) => async (dispatch, getState, api) => {
	if (dataLevel !== "admin" && dataLevel !== "gamePage") {
		dataLevel = "basic";
	}

	const res = await api.get(`/games/${dataLevel}/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const reloadGames = (ids, dataLevel) => async (dispatch, getState, api) => {
	if (dataLevel !== "admin" && dataLevel !== "gamePage") {
		dataLevel = "basic";
	}

	//Delete from redux
	const deleters = _.chain(ids)
		.map(id => [id, undefined])
		.fromPairs()
		.value();
	dispatch({ type: FETCH_GAMES, payload: deleters });

	//Get reloaded games
	const res = await api.get(`/games/${dataLevel}/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
	toast.success(`${ids.length} games refreshed`);
};

export const fetchGameList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games`);
	dispatch({ type: FETCH_GAME_LIST, payload: res.data });
};

export const createGame = values => async (dispatch, getState, api) => {
	const res = await api.post(`/games/`, values);
	if (res.data) {
		dispatch({ type: UPDATE_GAME, payload: res.data });
		return res.data.id;
	}
};

export const updateGame = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/`, values);
	toast.success("Game updated");
	await dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const deleteGame = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/games/${id}/`);
	if (res.data) {
		toast.success("Game deleted");
		await dispatch({ type: DELETE_GAME, payload: id });
		return true;
	}
	return false;
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

export const previewPostGameEventImage = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/postGameEvent/imagePreview`, values);
	return res.data;
};

export const submitPostGameEvents = (id, values) => async (dispatch, getState, api) => {
	const res = await api.post(`/games/${id}/postGameEvents/`, values);
	if (res.data) {
		toast.success("Events posted");
		return true;
	}
};

export const previewFixtureListImage = (year, competitions) => async (dispatch, getState, api) => {
	const res = await api.get(`/games/fixtureListImage/${year}/${competitions}`);
	return res.data;
};

export const postFixtureListImage = data => async (dispatch, getState, api) => {
	const res = await api.post("/games/fixtureListImage/", data);
	toast.success("Fixture Image posted");
	if (res.data) {
		return res.data;
	}
};

export const getCalendar = (_competitions, options) => async (dispatch, getState, api) => {
	const res = await api.post("/games/calendar", { _competitions, options });
	return res.data;
};

export const saveFanPotmVote = (gameId, playerId) => async (dispatch, getState, api) => {
	const res = await api.post(`/games/${gameId}/fan-potm-vote/${playerId}`);
	if (res.data) {
		const { hadAlreadyVoted, choice } = res.data;
		dispatch({ type: SAVE_FAN_POTM_VOTE, payload: { gameId, choice } });
		return hadAlreadyVoted;
	}
};
