import { FETCH_PLAYER_STAT_TYPES } from "./types";

export const fetchPlayerStatTypes = () => async (dispatch, getState, api) => {
	const res = await api.get("/stats/playerStatTypes");
	dispatch({ type: FETCH_PLAYER_STAT_TYPES, payload: res.data });
};
