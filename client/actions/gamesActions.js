import { FETCH_GAMES, FETCH_GAME_LIST, UPDATE_GAME, CRAWL_LOCAL_GAMES } from "./types";
import { toast } from "react-toastify";

export const fetchGames = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const fetchGameList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games`);
	dispatch({ type: FETCH_GAME_LIST, payload: res.data });
};

export const updateGameBasics = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/basics/`, values);
	toast.success("Game updated");
	dispatch({ type: UPDATE_GAME, payload: res.data });
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

export const postGameEvent = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const crawlLocalGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_LOCAL_GAMES, payload: res.data });
};

export const getPregameImage = (id, query = "") => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/images/pregame${query}`);
	return res.data;
};

export const tweetPregameImage = (id, query, tweetData) => async (dispatch, getState, api) => {
	await api.post(`/games/${id}/images/pregame${query}`, tweetData);
	toast.success("Tweet Sent!");
};

export const getSquadImage = id => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/images/squad`);
	return res.data;
};

export const tweetSquadImage = (id, tweetData) => async (dispatch, getState, api) => {
	await api.post(`/games/${id}/images/squad`, tweetData);
	toast.success("Tweet Sent!");
};

export const previewPlayerEventImage = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/imagePreview`, values);
	return res.data;
};
