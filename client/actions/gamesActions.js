import {
	FETCH_GAME,
	FETCH_GAMES,
	FETCH_GAME_LISTS,
	FETCH_HOMEPAGE_GAMES,
	UPDATE_GAME_BASICS
} from "./types";

export const fetchGame = slug => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get("/games/slug/" + slug).catch(e => {
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

	dispatch({ type: FETCH_GAME, payload, slug });
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

export const updateGameBasics = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/basics/`, values);
	dispatch({ type: UPDATE_GAME_BASICS, payload: res.data, slug: res.data.slug });
};
