//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

//Components
import SubMenu from "~/client/components/SubMenu";
import HelmetBuilder from "../components/HelmetBuilder";
import LoadingPage from "../components/LoadingPage";
import NotFoundPage from "~/client/pages/NotFoundPage";
import SeasonOverview from "~/client/components/seasons/SeasonOverview";
import SeasonPlayerStats from "~/client/components/seasons/SeasonPlayerStats";
import SeasonGameStats from "~/client/components/seasons/SeasonGameStats";

//Actions
import {
	fetchGameListByYear,
	fetchEntireGameList,
	fetchGames
} from "~/client/actions/gamesActions";
import { setActiveTeamType } from "~/client/actions/teamsActions";
import { getGameYearsNotYetLoaded, getYearsWithResults } from "~/helpers/gameHelper";

class SeasonPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = { isSSR: false };
		const {
			authUser,
			match,
			teamTypes: teamTypesList,
			gameList,
			gameYears,
			fullGames,
			fetchGames,
			activeTeamType,
			setActiveTeamType,
			fetchGameListByYear,
			fetchEntireGameList
		} = nextProps;

		const allowAllYears = authUser && authUser.isAdmin;

		//Once we have the game list, render the game list and find the available years
		let { years } = prevState;
		if (!years) {
			years = getYearsWithResults(gameYears);

			if (allowAllYears) {
				years.unshift("All");
			}

			newState.years = years;
		}

		//Get Active Year
		newState.year = years.find(y => y == match.params.year);

		//The years array will already contain "All" for admin users,
		//so we just need to ensure the find() was successful
		if (!newState.year) {
			//Add a number filter to make sure we don't ever default to "All"
			newState.year = years.filter(Number)[0];
		}

		//Ensure we have a gameList for the chosen year
		if (newState.year === "All") {
			const missingGameYears = getGameYearsNotYetLoaded(gameYears);
			if (missingGameYears.length) {
				if (!prevState.isLoadingGameList) {
					fetchEntireGameList();
					newState.isLoadingGameList = true;
				}
				return newState;
			}
		} else {
			if (!gameYears[newState.year]) {
				if (!prevState.isLoadingGameList) {
					fetchGameListByYear(newState.year);
					newState.isLoadingGameList = true;
				}
				return newState;
			}
		}

		newState.isLoadingGameList = false;

		//Get results for this year
		const results = _.filter(
			gameList,
			g =>
				g.date < new Date() &&
				(newState.year === "All" || g.date > new Date(`${newState.year}-01-01`))
		);

		//Get TeamTypes
		let { teamTypes } = prevState;
		if (!teamTypes || newState.year !== prevState.year) {
			teamTypes = _.chain(results)
				.filter(game => newState.year === "All" || game.date.getFullYear() == newState.year)
				.map(game => teamTypesList[game._teamType])
				.uniqBy("_id")
				.sortBy("sortOrder")
				.value();
			newState.teamTypes = teamTypes;
		}

		//Get Team Type from URL
		if (match.params.teamType) {
			const filteredTeamType = _.find(teamTypes, t => t.slug === match.params.teamType);
			if (filteredTeamType) {
				newState.teamType = filteredTeamType;
			}
		}

		//If no valid team type is found, we redirect to either the last active one, or just the first in the list
		if (!newState.teamType) {
			const teamTypeRedirect =
				_.find(teamTypes, t => t._id == activeTeamType) || teamTypes[0];

			newState.redirect = `${teamTypeRedirect.slug}/overview`;
			newState.teamType = activeTeamType;
		} else {
			//In case we've been redirected, clear out this value
			newState.redirect = undefined;
			if (activeTeamType != newState.teamType._id) {
				setActiveTeamType(newState.teamType._id);
			}
		}

		//Get Page
		newState.page = match.params.page || "overview";

		//If we have a team type but no page (i.e. /seasons/2019/first/), redirect to the page
		if (!match.params.page && newState.teamType) {
			newState.redirect = `${newState.teamType.slug}/overview`;
		}

		//Prevent SSR loading of fullGames, as this will never be rendered
		if (typeof window === "undefined") {
			newState.isSSR = true;
			return newState;
		}

		//On initial page load, if something changes, or while games are loading, check for games to load
		if (
			newState.year != prevState.year ||
			!prevState.teamType ||
			newState.teamType._id != prevState.teamType._id ||
			prevState.isLoadingGames
		) {
			const gamesRequired = results
				.filter(
					({ date }) => newState.year === "All" || date.getFullYear() == newState.year
				)
				.filter(({ _teamType }) => _teamType == newState.teamType._id);

			const gamesToLoad = gamesRequired.filter(g => !fullGames[g._id]).map(g => g._id);
			if (gamesToLoad.length && !prevState.isLoadingGames) {
				fetchGames(gamesToLoad);
				newState.isLoadingGames = true;
			} else if (!gamesToLoad.length) {
				newState.games = gamesRequired.map(g => fullGames[g._id]);
				newState.isLoadingGames = false;
			}
		}
		return newState;
	}

	generatePageHeader() {
		const { year, years } = this.state;
		const options = _.map(years, year => {
			return (
				<option key={year} value={year}>
					{year}
				</option>
			);
		});
		return [
			<select
				key="year-selector"
				onChange={ev => this.props.history.push(`/seasons/${ev.target.value}`)}
				value={year}
			>
				{options}
			</select>,
			<span key="results-header"> Season{year === "All" ? "s" : ""}</span>
		];
	}

	generateTeamTypeMenu() {
		const { teamTypes, year } = this.state;
		const list = teamTypes.map(({ name, slug }) => ({ label: name, slug }));
		return <SubMenu items={list} rootUrl={`/seasons/${year}/`} />;
	}

	generatePageMenu() {
		const { teamType, year } = this.state;
		const pages = [
			{ slug: "overview", label: "Overview" },
			{ slug: "player-stats", label: "Player Stats" },
			{ slug: "game-stats", label: "Game Stats" }
		];

		return (
			<SubMenu
				items={pages}
				rootUrl={`/seasons/${year}/${teamType.slug}/`}
				className="page-menu"
			/>
		);
	}

	generateHelmet() {
		const { fullTeams, localTeam } = this.props;
		const { year, teamType, page } = this.state;
		const specifyTeamTypeInMeta = teamType.sortOrder > 1;

		//Title
		let title = `${year} ${fullTeams[localTeam].name.long}`;
		if (specifyTeamTypeInMeta) {
			title += ` ${teamType.name}`;
		}
		title += " Season";

		if (year === "All") {
			title += "s";
		}

		switch (page) {
			case "player-stats":
				title = `Player Stats - ${title}`;
				break;
			case "game-stats":
				title = `Game Stats - ${title}`;
				break;
		}

		//Canonical
		let canonical = `/season/${year}/${teamType.slug}/${page}`;

		//Render
		return <HelmetBuilder title={title} canonical={canonical} />;
	}

	renderContent() {
		const { page, games, year, teamType, isLoadingGames, isSSR } = this.state;
		if (isLoadingGames || isSSR) {
			return <LoadingPage />;
		} else {
			const props = {
				games,
				year,
				teamType
			};

			switch (page) {
				case "overview":
					return <SeasonOverview {...props} />;
				case "player-stats":
					return <SeasonPlayerStats {...props} />;
				case "game-stats":
					return <SeasonGameStats {...props} />;
				default:
					return <NotFoundPage />;
			}
		}
	}

	render() {
		const { isLoadingGameList, year, redirect } = this.state;

		if (redirect) {
			return <Redirect to={`/seasons/${year}/${redirect}`} />;
		}

		if (isLoadingGameList) {
			return <LoadingPage />;
		}

		return (
			<div className="season-page">
				{this.generateHelmet()}

				<section className="page-header no-margin">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
						{this.generateTeamTypeMenu()}
						{this.generatePageMenu()}
					</div>
				</section>
				{this.renderContent()}
			</div>
		);
	}
}

async function loadData(store, path) {
	//Get year from URL
	const splitPath = path.split("/");
	let year = splitPath.length > 2 ? Number(splitPath[2]) : null;

	//Ensure it's a valid year
	const { gameYears } = store.getState().games;
	const yearsWithResults = getYearsWithResults(gameYears);
	if (!yearsWithResults.includes(year)) {
		year = yearsWithResults[0];
	}

	//Load the game list
	await store.dispatch(fetchGameListByYear(year));
}

function mapStateToProps({ config, games, teams }) {
	const { authUser, localTeam } = config;
	const { gameList, gameYears, fullGames } = games;
	const { fullTeams, teamTypes, activeTeamType } = teams;
	return {
		authUser,
		localTeam,
		gameList,
		gameYears,
		fullGames,
		fullTeams,
		teamTypes,
		activeTeamType
	};
}

export default {
	component: connect(mapStateToProps, {
		fetchGameListByYear,
		fetchEntireGameList,
		fetchGames,
		setActiveTeamType
	})(SeasonPage),
	loadData
};
