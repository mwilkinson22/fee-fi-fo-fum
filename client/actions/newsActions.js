import {
	FETCH_HOMEPAGE_POSTS,
	FETCH_NEWS_POST,
	FETCH_POST_LIST,
	FETCH_POST_PAGINATION,
	FETCH_SIDEBAR_POSTS
} from "./types";

export const fetchNewsPostBySlug = slug => async (dispatch, getState, api) => {
	const res = await api.get(`/news/slug/${slug}`);
	dispatch({ type: FETCH_NEWS_POST, payload: res.data });
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
