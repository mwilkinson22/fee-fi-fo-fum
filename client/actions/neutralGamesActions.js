import _ from "lodash";
import {
	FETCH_NEUTRAL_GAMES,
	CRAWL_NEUTRAL_GAMES,
	UPDATE_NEUTRAL_GAMES,
	DELETE_NEUTRAL_GAME,
	FETCH_NEUTRAL_GAME_YEARS
} from "./types";
import { toast } from "react-toastify";

export const fetchNeutralGames = year => async (dispatch, getState, api) => {
	const res = await api.get(`/neutralGames/${year}`);
	dispatch({ type: FETCH_NEUTRAL_GAMES, payload: res.data, year });
};

export const fetchNeutralGamesFromId = id => async (dispatch, getState, api) => {
	const res = await api.get(`/neutralGames/fromId/${id}`);
	dispatch({ type: FETCH_NEUTRAL_GAMES, payload: res.data.games, year: res.data.year });
};

export const fetchNeutralGameYears = () => async (dispatch, getState, api) => {
	const res = await api.get(`/neutralGames/years`);
	dispatch({ type: FETCH_NEUTRAL_GAME_YEARS, payload: res.data });
};

export const createNeutralGames = data => async (dispatch, getState, api) => {
	const res = await api.post("/neutralGames", data);
	toast.success("Game Created");
	dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
	return res.data;
};

export const updateNeutralGames = data => async (dispatch, getState, api) => {
	const res = await api.put("/neutralGames", data);
	toast.success("Games Updated");
	dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
};

export const deleteNeutralGame = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/neutralGames/${id}`);
	if (res.data) {
		toast.success("Game Deleted");
		dispatch({ type: DELETE_NEUTRAL_GAME, payload: id });
		return true;
	}
};

export const crawlNeutralGames = () => async (dispatch, getState, api) => {
	const res = await api.get(`/neutralGames/crawl`);
	dispatch({ type: CRAWL_NEUTRAL_GAMES, payload: res.data });
};

export const crawlAndUpdateNeutralGames = () => async (dispatch, getState, api) => {
	toast.success("Checking for games...");
	const res = await api.get(`/neutralGames/crawl/update`);
	const gameCount = _.flatten(_.map(res.data, games => _.values(games))).length;
	if (gameCount === 0) {
		toast.success("No games to update");
	} else {
		dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: res.data });
		toast.success(`Updated ${gameCount} ${gameCount.length === 1 ? "game" : "games"}`);
	}
};
