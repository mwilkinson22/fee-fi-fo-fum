import React from "react";
import App from "./App";
import { Redirect } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AwardPage from "./pages/AwardPage";
import GamePage from "./pages/GamePage";
import GameList from "./pages/GameList";
import PersonPage from "./pages/PersonPage";
import SquadListPage from "./pages/SquadListPage";
import SeasonPage from "./pages/SeasonPage";
import NewsListPage from "./pages/NewsListPage";
import NewsPostPage from "./pages/NewsPostPage";
import NotFoundPage from "./pages/NotFoundPage";
import TeamSelectorPage from "./pages/TeamSelectorPage";
import AdminRouter from "./components/admin";
import NewsPostLegacyRedirect from "./components/news/NewsPostLegacyRedirect";

const awardRoutes = [
	{
		...AwardPage,
		path: "/awards"
	}
];

const gameRoutes = [
	{
		...GameList,
		path: "/games/results/:year/:teamType"
	},
	{
		...GameList,
		path: "/games/results/:year"
	},
	{
		...GameList,
		path: "/games/results"
	},
	{
		...GameList,
		path: "/games/fixtures/:teamType"
	},
	{
		...GameList,
		path: "/games/fixtures"
	},
	{
		...GamePage,
		path: "/games/:slug"
	},
	{
		component: () => <Redirect to="/games/fixtures" />,
		path: "/games",
		exact: true
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
	},
	{
		//For the legacy site
		component: () => <Redirect to="/squads" />,
		path: "/players",
		exact: true
	}
];

const squadRoutes = [
	{
		...SquadListPage,
		path: "/squads/:year/:teamType"
	},
	{
		...SquadListPage,
		path: "/squads/:year"
	},
	{
		...SquadListPage,
		path: "/squads"
	}
];

const seasonRoutes = [
	{
		...SeasonPage,
		path: "/seasons/:year/:teamType/:page"
	},
	{
		...SeasonPage,
		path: "/seasons/:year/:teamType"
	},
	{
		...SeasonPage,
		path: "/seasons/:year"
	},
	{
		...SeasonPage,
		path: "/seasons"
	}
];

const newsRoutes = [
	{
		...NewsPostPage,
		path: "/news/post/:slug"
	},
	{
		...NewsListPage,
		path: "/news/category/:category/:page"
	},
	{
		...NewsListPage,
		path: "/news/category/:category"
	},
	{
		//Handle old links from social media
		...NewsPostLegacyRedirect,
		path: "/news/:legacycategory/:id"
	},
	{
		component: () => <Redirect to="/news/category/all" />,
		path: "/news/category",
		exact: true
	},
	{
		component: () => <Redirect to="/news/category/all" />,
		path: "/news",
		exact: true
	}
];

const teamSelectorRoutes = [
	{
		...TeamSelectorPage,
		path: "/team-selectors/:slug"
	}
];

export default [
	{
		...App,
		routes: [
			...awardRoutes,
			...gameRoutes,
			...personRoutes,
			...squadRoutes,
			...newsRoutes,
			...seasonRoutes,
			...teamSelectorRoutes,
			{
				...HomePage,
				path: "/",
				exact: true
			},
			{
				...AdminRouter,
				path: "/admin"
			},
			{
				component: NotFoundPage,
				path: "/"
			}
		]
	}
];
