import { FETCH_GAME, FETCH_GAMES, FETCH_GAME_LISTS, FETCH_HOMEPAGE_GAMES } from "./types";

export const fetchGame = slug => async (dispatch, getState, api) => {
	const res = await api.get("/games/slug/" + slug);
	dispatch({ type: FETCH_GAME, payload: res.data });
};

export const fetchGames = (year, teamType) => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${year}/${teamType}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const fetchGameLists = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/lists/");
	dispatch({ type: FETCH_GAME_LISTS, payload: res.data });
};

export const fetchHomepageGames = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/homepage/");
	dispatch({ type: FETCH_HOMEPAGE_GAMES, payload: res.data });
};
