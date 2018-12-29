import axios from "axios";
import {
	FETCH_NEWS_CATEGORIES,
	FETCH_NEWS_POST,
	FETCH_POST_LIST,
	FETCH_POST_PAGINATION,
	FETCH_SIDEBAR_POSTS
} from "./types";

export const fetchNewsCategories = () => async dispatch => {
	const res = await axios.get("/api/news/categories");
	dispatch({ type: FETCH_NEWS_CATEGORIES, payload: res.data });
};

export const fetchNewsPostBySlug = (category, slug) => async dispatch => {
	const res = await axios.get(`/api/news/slug/${category}/${slug}`);
	dispatch({ type: FETCH_NEWS_POST, payload: res.data });
};

export const fetchSidebarPosts = () => async dispatch => {
	const res = await axios.get("/api/news/sidebarPosts");
	dispatch({ type: FETCH_SIDEBAR_POSTS, payload: res.data });
};

export const fetchPostList = (category, page) => async dispatch => {
	const res = await axios.get(`/api/news/posts/${category}/${page}`);
	dispatch({ type: FETCH_POST_LIST, payload: res.data });
};

export const fetchPostPagination = category => async dispatch => {
	const res = await axios.get(`/api/news/pagination/${category}`);
	dispatch({ type: FETCH_POST_PAGINATION, payload: res.data });
};
