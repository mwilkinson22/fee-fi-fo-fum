import {
	ADD_NEWS_POST_SLUG,
	DELETE_POST,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_PAGE,
	FETCH_NEWS_POST_PAGECOUNT,
	FETCH_POST_LIST,
	CLEAR_POST_PAGINATION,
	SET_FULL_POST_LIST_LOADED
} from "./types";
import { toast } from "react-toastify";

export const fetchNewsPostPageCount = () => async (dispatch, getState, api) => {
	const res = await api.get("/news/posts/pagecount");
	dispatch({ type: FETCH_NEWS_POST_PAGECOUNT, payload: res.data });
};

export const fetchNewsPostPage = (category, page) => async (dispatch, getState, api) => {
	const res = await api.get(`/news/posts/page/${category}/${page}`);
	dispatch({ type: FETCH_NEWS_POST_PAGE, payload: res.data, category, page });
};

export const fetchNewsPost = id => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/news/post/id/${id}`).catch(e => {
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

export const fetchNewsPostBySlug = slug => async (dispatch, getState, api) => {
	let errorFound = false;
	const res = await api.get(`/news/post/slug/${slug}/`).catch(e => {
		errorFound = true;
		switch (e.response.status) {
			case 404:
				dispatch({ type: ADD_NEWS_POST_SLUG, payload: { [slug]: false } });
				break;
		}
	});

	//Handle retrieved post
	if (!errorFound) {
		//Add game before adding slug, to prevent errors
		dispatch({ type: FETCH_NEWS_POST, payload: res.data });
		//Get ID
		const _id = Object.keys(res.data.fullPosts)[0];
		dispatch({ type: ADD_NEWS_POST_SLUG, payload: { [slug]: _id } });
	}
};

export const fetchFirstSixPosts = () => async (dispatch, getState, api) => {
	const res = await api.get(`/news/posts/firstSix`);
	dispatch({ type: FETCH_POST_LIST, payload: res.data });
};

export const fetchPostList = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/news/posts/${ids.join(",")}`);
	dispatch({ type: FETCH_POST_LIST, payload: res.data });
};

export const fetchEntirePostList = () => async (dispatch, getState, api) => {
	const { postList } = getState().news;
	const res = await api.get(`/news/posts/all?exclude=${Object.keys(postList).join(",")}`);
	if (res.data) {
		dispatch({ type: FETCH_POST_LIST, payload: res.data });
		dispatch({ type: SET_FULL_POST_LIST_LOADED });
	}
};

export const createNewsPost = values => async (dispatch, getState, api) => {
	const res = await api.post(`/news/post/`, values);
	if (res.data) {
		dispatch({ type: FETCH_NEWS_POST, payload: res.data });
		dispatch({ type: CLEAR_POST_PAGINATION });
		toast.success("Post Created");
		return res.data._id;
	}
};

export const updateNewsPost = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/news/post/${id}`, values);
	if (res.data) {
		dispatch({ type: FETCH_NEWS_POST, payload: res.data });
		dispatch({ type: CLEAR_POST_PAGINATION });
		toast.success("Post updated");
	}
};

export const deleteNewsPost = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/news/post/${id}`);
	if (res.data) {
		await dispatch({ type: DELETE_POST, payload: res.data });
		dispatch({ type: CLEAR_POST_PAGINATION });
		toast.success("Post deleted");
		return true;
	}
};
