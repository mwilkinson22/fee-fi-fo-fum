import axios from "axios";
import { FETCH_USER, FETCH_GAMES } from "./types";

export const fetchUser = () => async dispatch => {
	const res = await axios.get("/api/current_user");
	dispatch({ type: FETCH_USER, payload: res.data });
};

export const fetchGames = () => async dispatch => {
	const res = await axios.get("/api/games/fixtures");
	dispatch({ type: FETCH_GAMES, payload: res.data });
};
