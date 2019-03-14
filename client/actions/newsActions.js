import { FETCH_NEWS_POST, FETCH_NEWS_POST_LEGACY, FETCH_POST_LIST } from "./types";

export const fetchNewsPost = id => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/news/post/${id}`).catch(e => {
		switch (e.response.status) {
			case 404:
				payload = false;
				break;
		}
	});

	if (payload === undefined) {
		payload = res.data;
	}

	dispatch({ type: FETCH_NEWS_POST, payload });
};

export const fetchPostList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/news/posts`);
	dispatch({ type: FETCH_POST_LIST, payload: res.data });
};

export const fetchLegacyNewsPost = id => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/news/legacyPost/${id}`).catch(e => {
		switch (e.response.status) {
			case 404:
				payload = false;
		}
	});

	if (payload === undefined) {
		payload = res.data;
	}
	dispatch({ type: FETCH_NEWS_POST_LEGACY, payload, id });
};
