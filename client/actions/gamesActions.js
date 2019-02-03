import axios from "axios";
import { FETCH_GAME, FETCH_GAMES, FETCH_GAME_LISTS, FETCH_FRONTPAGE_GAMES } from "./types";

export const fetchGame = slug => async dispatch => {
	const res = await axios.get("/api/games/slug/" + slug);
	dispatch({ type: FETCH_GAME, payload: res.data });
};

export const fetchGames = (year, teamType) => async dispatch => {
	const res = await axios.get(`/api/games/${year}/${teamType}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
};

export const fetchGameLists = () => async dispatch => {
	const res = await axios.get("/api/games/lists/");
	dispatch({ type: FETCH_GAME_LISTS, payload: res.data });
};

export const fetchFrontpageGames = () => async dispatch => {
	const res = await axios.get("/api/games/frontpage/");
	dispatch({ type: FETCH_FRONTPAGE_GAMES, payload: res.data });
};
