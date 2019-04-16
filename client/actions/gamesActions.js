import {
	FETCH_GAMES,
	FETCH_GAME_LIST,
	UPDATE_GAME,
	FETCH_NEUTRAL_GAMES,
	CRAWL_LOCAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES,
	DELETE_NEUTRAL_GAME
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

export const deleteNeutralGame = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/games/neutral/${id}`);
	toast.success("Game Deleted");
	dispatch({ type: DELETE_NEUTRAL_GAME, payload: res.data });
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

export const crawlLocalGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_LOCAL_GAMES, payload: res.data });
};

export const crawlNeutralGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawl/local`);
	dispatch({ type: CRAWL_NEUTRAL_GAMES, payload: res.data });
};

export const crawlAndUpdateNeutralGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/crawlAndUpdate/neutral`);
	const gameCount = Object.keys(res.data).length;
	if (gameCount === 0) {
		toast.error("No games to update");
	} else {
		toast.success(`Updated ${gameCount} ${gameCount.length === 1 ? "game" : "games"}`);
	}
	dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
};
