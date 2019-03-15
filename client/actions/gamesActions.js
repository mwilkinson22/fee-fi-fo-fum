import _ from "lodash";
import { FETCH_GAMES, FETCH_GAME_LIST, UPDATE_GAME_BASICS, SET_PREGAME_SQUADS } from "./types";

export const fetchGames = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const fetchGameList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games`);
	dispatch({ type: FETCH_GAME_LIST, payload: res.data });
};

/*
export const fetchGameLists = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/lists/");
	dispatch({ type: FETCH_GAME_LISTS, payload: res.data });
};

export const fetchHomepageGames = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/homepage/");
	dispatch({ type: FETCH_HOMEPAGE_GAMES, payload: res.data });
};
*/

export const updateGameBasics = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/basics/`, values);
	dispatch({ type: UPDATE_GAME_BASICS, payload: res.data, slug: res.data.slug });
};

export const setPregameSquads = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/pregame/`, values);
	dispatch({ type: SET_PREGAME_SQUADS, payload: res.data, slug: res.data.slug });
};
