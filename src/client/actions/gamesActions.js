import {
	FETCH_GAMES,
	FETCH_GAME_LIST_BY_IDS,
	UPDATE_GAME,
	DELETE_GAME,
	SAVE_FAN_POTM_VOTE,
	UPDATE_NEUTRAL_GAMES,
	FETCH_GAME_YEARS,
	ADD_GAME_SLUG,
	FETCH_HOMEPAGE_GAMES,
	FETCH_GAME_LIST_BY_YEAR,
	FETCH_ENTIRE_GAME_LIST
} from "./types";
import { toast } from "react-toastify";
import _ from "lodash";

export const fetchGames = (ids, dataLevel) => async (dispatch, getState, api) => {
	if (dataLevel !== "admin" && dataLevel !== "gamePage") {
		dataLevel = "basic";
	}

	//Enforce limit
	const { fetchGameLimit } = getState().config;
	const queries = _.chain(ids)
		.uniq()
		.chunk(fetchGameLimit || 99999999999)
		.map(chunkedIds => api.get(`/games/${dataLevel}/${chunkedIds.join(",")}`))
		.value();

	const results = await Promise.all(queries);
	const payload = _.merge(...results.map(({ data }) => data));

	dispatch({ type: FETCH_GAMES, payload });
};

export const fetchGameFromSlug = slug => async (dispatch, getState, api) => {
	let errorFound = false;
	const res = await api.get(`/games/slug/${slug}/`).catch(e => {
		errorFound = true;
		switch (e.response.status) {
			case 404:
				dispatch({ type: ADD_GAME_SLUG, payload: { [slug]: false } });
				break;
		}
	});

	//Handle retrieved game
	if (!errorFound) {
		//Add game before adding slug, to prevent errors
		dispatch({ type: FETCH_GAMES, payload: res.data });
		//Get ID
		const _id = Object.keys(res.data)[0];
		dispatch({ type: ADD_GAME_SLUG, payload: { [slug]: _id } });
	}
};

export const fetchGameYears = () => async (dispatch, getState, api) => {
	const res = await api.get(`/games/years`);
	const yearsAsObject = _.fromPairs(res.data.map(year => [year, false]));
	dispatch({ type: FETCH_GAME_YEARS, payload: yearsAsObject });
};

export const fetchHomePageGames = () => async (dispatch, getState, api) => {
	const res = await api.get("/games/homepage");

	//First we work out which games actually need adding
	//to the store, as there's no point adding a "basic" game
	//if we've already loaded a higher dataLevel
	const { fullGames } = getState().games;
	const gamesToAdd = {};
	for (const id in res.data) {
		if (!fullGames[id]) {
			gamesToAdd[id] = res.data[id];
		}
	}

	if (Object.keys(gamesToAdd).length) {
		dispatch({ type: FETCH_GAMES, payload: gamesToAdd });
	}

	//Then update the homepage entry
	dispatch({ type: FETCH_HOMEPAGE_GAMES, payload: Object.keys(res.data) });
};

export const reloadGames = (ids, dataLevel) => async (dispatch, getState, api) => {
	if (dataLevel !== "admin" && dataLevel !== "gamePage") {
		dataLevel = "basic";
	}

	//Delete from redux
	const deleters = _.chain(ids)
		.map(id => [id, undefined])
		.fromPairs()
		.value();
	dispatch({ type: FETCH_GAMES, payload: deleters });

	//Get reloaded games
	const res = await api.get(`/games/${dataLevel}/${ids.join(",")}`);
	dispatch({ type: FETCH_GAMES, payload: res.data });
	toast.success(`${ids.length} games refreshed`);
};

export const fetchEntireGameList = () => async (dispatch, getState, api) => {
	const { gameList } = getState().games;
	const res = await api.get(`/games/list?exclude=${Object.keys(gameList).join(",")}`);
	dispatch({ type: FETCH_ENTIRE_GAME_LIST, payload: res.data });
};

export const fetchGameListByIds = ids => async (dispatch, getState, api) => {
	const res = await api.get(`/games/listByIds/${ids.join(",")}`);
	dispatch({ type: FETCH_GAME_LIST_BY_IDS, payload: res.data });
};

export const fetchGameListByYear = year => async (dispatch, getState, api) => {
	//Basic URL
	let url = `/games/listByYear/${year}`;

	//Get existing data
	const { gameList, gameYears } = getState().games;

	//Ensure we have a valid year
	//Always allow fixtures
	if (year !== "fixtures" && gameYears[year] === undefined) {
		return false;
	}

	//Get Current IDs so we're not duplicating data
	if (gameList) {
		const gamesToExclude = _.filter(gameList, g => {
			if (year === "fixtures") {
				return g.date > new Date();
			} else {
				return (
					//Exclude fixtures
					g.date < new Date() &&
					//Within the given year
					g.date >= new Date(`${year}-01-01`) &&
					g.date < new Date(`${Number(year) + 1}-01-01`)
				);
			}
		}).map(g => g._id);

		if (gamesToExclude.length) {
			url += `?exclude=${gamesToExclude.join(",")}`;
		}
	}

	const res = await api.get(url);
	dispatch({ type: FETCH_GAME_LIST_BY_YEAR, payload: { games: res.data, year } });
};

export const createGame = values => async (dispatch, getState, api) => {
	const res = await api.post(`/games/`, values);
	if (res.data) {
		dispatch({ type: UPDATE_GAME, payload: res.data });
		toast.success("Game created");
		return res.data.id;
	}
};

export const updateGame = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/`, values);
	toast.success("Game updated");
	await dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const deleteGame = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/games/${id}/`);
	if (res.data) {
		toast.success("Game deleted");
		await dispatch({ type: DELETE_GAME, payload: id });
		return true;
	}
	return false;
};

export const setSquad = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/squad/`, values);
	toast.success("Squad saved");
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const markSquadAsAnnounced = (id, announced) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/squadsAnnounced`, { announced });
	dispatch({ type: UPDATE_GAME, payload: res.data });
};

export const postGameEvent = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/`, values);
	if (res.data) {
		dispatch({ type: UPDATE_GAME, payload: res.data });
		if (values.postTweet) {
			toast.success("Tweet Sent");
		} else {
			toast.success("Game Updated");
		}

		return _.orderBy(res.data.fullGames[id].events, ["date"], ["desc"])[0];
	} else {
		return false;
	}
};

export const crawlGame = (id, includeScoringStats) => async (dispatch, getState, api) => {
	const res = await api.get(`/games/${id}/crawl?includeScoringStats=${includeScoringStats}`);
	return res.data || false;
};

export const setStats = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/stats`, values);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Stats saved");
};

export const deleteGameEvent = (id, event, params) => async (dispatch, getState, api) => {
	const query = _.map(params, (val, key) => `${key}=${val.toString()}`).join("&");
	const res = await api.delete(`/games/${id}/event/${event}?${query}`);
	dispatch({ type: UPDATE_GAME, payload: res.data });
	toast.success("Event deleted");
	return res.data.fullGames[id].events;
};

export const getPregameImage = (id, query = "") => async (dispatch, getState, api) => {
	const res = await api.get(`/games/images/pregame/${id}${query}`);
	return res.data;
};

export const getSquadImage = (id, showOpposition) => async (dispatch, getState, api) => {
	const res = await api.get(`/games/images/squad/${id}?showOpposition=${showOpposition.toString()}`);
	return res.data;
};

export const previewPlayerEventImage = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/event/imagePreview`, values);
	return res.data;
};

export const previewPostGameEventImage = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/games/${id}/postGameEvent/imagePreview`, values);
	return res.data;
};

export const submitPostGameEvents = (id, values) => async (dispatch, getState, api) => {
	const res = await api.post(`/games/${id}/postGameEvents/`, values);
	if (res.data) {
		toast.success("Events posted");
		return true;
	}
};

export const previewFixtureListImage = (year, competitions, fixturesOnly, dateBreakdown) => async (
	dispatch,
	getState,
	api
) => {
	const res = await api.get(
		`/games/images/fixtureList/${year}/${competitions}?fixturesOnly=${fixturesOnly.toString()}&dateBreakdown=${dateBreakdown.toString()}`
	);
	return res.data;
};

export const postFixtureListImage = data => async (dispatch, getState, api) => {
	const res = await api.post("/games/images/fixtureList/", data);
	if (res.data) {
		toast.success("Fixture Image posted");
		return res.data;
	}
};

export const saveFanPotmVote = (gameId, playerId) => async (dispatch, getState, api) => {
	const res = await api.post(`/games/${gameId}/fan-potm-vote/${playerId}`);
	if (res.data) {
		const { hadAlreadyVoted, choice } = res.data;
		dispatch({ type: SAVE_FAN_POTM_VOTE, payload: { gameId, choice } });
		return hadAlreadyVoted;
	}
};

export const addCrawledGames = games => async (dispatch, getState, api) => {
	const res = await api.post(`/games/crawled/`, games);
	if (res.data) {
		const gameCount = [];

		const { local, neutral } = res.data;
		if (local) {
			dispatch({ type: UPDATE_GAME, payload: local });
			gameCount.push(`${local.fullGames.length} local ${local.fullGames.length === 1 ? "game" : "games"}`);
		}

		if (neutral) {
			const neutralGameCount = _.flatten(_.map(neutral, _.values)).length;
			gameCount.push(`${neutralGameCount} neutral ${neutralGameCount === 1 ? "game" : "games"}`);

			if (getState().games.neutralGames) {
				dispatch({ type: UPDATE_NEUTRAL_GAMES, payload: neutral });
			}
		}

		toast.success(`${gameCount.join(" & ")} created`);
		return true;
	}
};
