import axios from "axios";
import { FETCH_PLAYER_STAT_TYPES } from "./types";

export const fetchPlayerStatTypes = () => async dispatch => {
	const res = await axios.get("/api/stats/playerStatTypes");
	dispatch({ type: FETCH_PLAYER_STAT_TYPES, payload: res.data });
};
