import { FETCH_OAUTH_ACCOUNTS } from "../actions/types";

export const getAuthorisedAccounts = () => async (dispatch, getState, api) => {
	const res = await api.get(`/oauth/authorisedAccounts`);

	dispatch({ type: FETCH_OAUTH_ACCOUNTS, payload: res.data });
};

export const disconnectAccount = service => async (dispatch, getState, api) => {
	const res = await api.get(`/oauth/${service}/disconnect`);

	dispatch({ type: FETCH_OAUTH_ACCOUNTS, payload: res.data });
};
