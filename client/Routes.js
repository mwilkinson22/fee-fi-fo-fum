import React from "react";
import App from "./App";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import GameList from "./pages/GameList";
import PersonPage from "./pages/PersonPage";
import SquadListPage from "./pages/SquadListPage";
import NewsListPage from "./pages/NewsListPage";
import NewsPostPage from "./pages/NewsPostPage";

const gameRoutes = [
	{
		...GamePage,
		path: "/games/:slug"
	},
	{
		...GameList,
		path: "/games/results"
	},
	{
		...GameList,
		path: "/games/results/:year"
	},
	{
		...GameList,
		path: "/games/results/:year/:teamType"
	},
	{
		...GameList,
		path: "/games/fixtures"
	},
	{
		...GameList,
		path: "/games/fixtures/:teamType"
	}
];

const personRoutes = [
	{
		...PersonPage,
		path: "/players/:slug"
	},
	{
		...PersonPage,
		path: "/coaches/:slug"
	}
];

const squadRoutes = [
	{
		...SquadListPage,
		path: "/squads"
	}
];

const newsRoutes = [
	{
		...NewsPostPage,
		path: "/news/post/:slug"
	},
	{
		...NewsListPage,
		path: "/news/:category/:page"
	},
	{
		...NewsListPage,
		path: "/news/:category"
	}
];

export default [
	{
		...App,
		routes: [
			{
				...HomePage,
				path: "/",
				exact: true
			},
			...gameRoutes,
			...personRoutes,
			...squadRoutes,
			...newsRoutes
		]
	}
];
