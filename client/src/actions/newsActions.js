import axios from "axios";
import { FETCH_NEWS_CATEGORIES, FETCH_NEWS_POST, FETCH_RECENT_NEWS } from "./types";

export const fetchNewsCategories = () => async dispatch => {
	const res = await axios.get("/api/news/categories");
	dispatch({ type: FETCH_NEWS_CATEGORIES, payload: res.data });
};

export const fetchNewsPostBySlug = (category, slug) => async dispatch => {
	const res = await axios.get(`/api/news/slug/${category}/${slug}`);
	dispatch({ type: FETCH_NEWS_POST, payload: res.data });
};

export const fetchRecentPosts = () => async dispatch => {
	const res = await axios.get("/api/news/recentPosts");
	dispatch({ type: FETCH_RECENT_NEWS, payload: res.data });
};
