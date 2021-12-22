import { FETCH_OAUTH_ACCOUNTS } from "./types";

export const getAuthorisedAccounts = includeSecret => async (dispatch, getState, api) => {
	//includeSecret should only be set for admin users setting up
	//a social profile. We validate user admin status server-side,
	//setting it to true for non-admin users will have no effect
	const url = `/oauth/authorisedAccounts${includeSecret ? "?secret=true" : ""}`;
	const res = await api.get(url);

	dispatch({ type: FETCH_OAUTH_ACCOUNTS, payload: res.data });

	return res.data;
};

export const disconnectAccount = service => async (dispatch, getState, api) => {
	const res = await api.get(`/oauth/${service}/disconnect`);

	dispatch({ type: FETCH_OAUTH_ACCOUNTS, payload: res.data });
};
