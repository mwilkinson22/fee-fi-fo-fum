import {
	FETCH_GAMES,
	FETCH_GAME_LIST,
	UPDATE_GAME_BASICS,
	SET_PREGAME_SQUADS,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES
} from "./types";
import { toast } from "react-toastify";

export const fetchGames = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const fetchGameList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games`);
	dispatch({ type: FETCH_GAME_LIST, payload: res.data });
};

export const fetchNeutralGames = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/neutral");
	dispatch({ type: FETCH_NEUTRAL_GAMES, payload: res.data });
};

export const createNeutralGames = data => async (dispatch, getState, api) => {
	const res = await api.post("/games/neutral", data);
	toast.success("Game Created");
	dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
};

export const updateNeutralGames = data => async (dispatch, getState, api) => {
	const res = await api.put("/games/neutral", data);
	toast.success("Games Updated");
	dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
};

export const updateGameBasics = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/basics/`, values);
	toast.success("Game updated");
	dispatch({ type: UPDATE_GAME_BASICS, payload: res.data, slug: res.data.slug });
};

export const setPregameSquads = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/pregame/`, values);
	toast.success("Squads saved");
	dispatch({ type: SET_PREGAME_SQUADS, payload: res.data, slug: res.data.slug });
};

export const crawlLocalGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_LOCAL_GAMES, payload: res.data });
};

export const crawlNeutralGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_NEUTRAL_GAMES, payload: res.data });
};
