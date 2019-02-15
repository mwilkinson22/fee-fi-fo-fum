import {
	FETCH_HOMEPAGE_POSTS,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_LEGACY,
	FETCH_POST_LIST,
	FETCH_POST_PAGINATION,
	FETCH_SIDEBAR_POSTS
} from "./types";

export const fetchNewsPostBySlug = slug => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/news/slug/${slug}`).catch(e => {
		switch (e.response.status) {
			case 307:
			case 308:
				payload = { ...e.response.data, redirect: true };
				break;
			case 404:
				payload = false;
				break;
		}
	});

	//Handle retrieved player
	if (payload === undefined) {
		payload = res.data;
	}

	dispatch({ type: FETCH_NEWS_POST, payload, slug });
};

export const fetchSidebarPosts = () => async (dispatch, getState, api) => {
	const res = await api.get("/news/sidebarPosts");
	dispatch({ type: FETCH_SIDEBAR_POSTS, payload: res.data });
};

export const fetchHomepagePosts = () => async (dispatch, getState, api) => {
	const res = await api.get("/news/homepage");
	dispatch({ type: FETCH_HOMEPAGE_POSTS, payload: res.data });
};

export const fetchPostList = (category, page) => async (dispatch, getState, api) => {
	const res = await api.get(`/news/posts/${category}/${page}`);
	dispatch({ type: FETCH_POST_LIST, payload: res.data });
};

export const fetchPostPagination = category => async (dispatch, getState, api) => {
	const res = await api.get(`/news/pagination/${category}`);
	dispatch({ type: FETCH_POST_PAGINATION, payload: { [category]: res.data.pages } });
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
