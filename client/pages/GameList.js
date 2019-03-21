import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import GameFilters from "../components/games/GameFilters";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import { fetchAllTeamTypes } from "../actions/teamsActions";
import GameCard from "../components/games/GameCard";
import { NavLink } from "react-router-dom";
import { validateGameDate } from "../../helpers/gameHelper";
import HelmetBuilder from "../components/HelmetBuilder";

class GameList extends Component {
	constructor(props) {
		super(props);
		const { gameList, match, fetchGameList, teamTypes, fetchAllTeamTypes } = props;

		if (!gameList) {
			fetchGameList();
		}

		if (!teamTypes) {
			fetchAllTeamTypes();
		}

		const listType = match.path.split("/")[2]; //Fixtures or Results

		this.state = { listType };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { gameList, fullGames, teamTypes, match, fetchGames } = nextProps;
		const path = match.path.split("/");
		//Fixtures or Results?
		newState.listType = path[2];

		if (!teamTypes || !gameList) {
			return {};
		}

		//Team Type
		if (match.params.teamType) {
			const filteredTeamTypes = _.filter(teamTypes, t => t.slug === match.params.teamType);
			if (filteredTeamTypes.length) {
				newState.teamType = filteredTeamTypes[0]._id;
			}
		}

		if (!newState.teamType) {
			newState.teamType = _.chain(teamTypes)
				.values()
				.sortBy("sortOrder")
				.value()[0]._id;
		}

		//Years
		const now = new Date();
		if (newState.listType === "results") {
			//Get Years
			newState.years = _.chain(gameList)
				.reject(game => game.date > now)
				.map(game => game.date.getFullYear())
				.uniq()
				.sort()
				.reverse()
				.value();

			//Get Active Year
			newState.year = match.params.year || newState.years[0];
		}

		//Games
		const gameIds = _.chain(gameList)
			.filter(game => game._teamType === newState.teamType)
			.filter(game => validateGameDate(game, newState.listType, newState.year))
			.orderBy(["date"], [newState.listType === "results" ? "desc" : "asc"])
			.map(game => game._id)
			.value();
		const gamesToLoad = _.reject(gameIds, game => fullGames[game]);

		if (gamesToLoad.length) {
			fetchGames(gamesToLoad);
			newState.games = undefined;
		} else {
			newState.games = _.map(gameIds, id => fullGames[id]);
		}

		//Reset Filters
		if (newState.year !== prevState.year || newState.teamType !== prevState.teamType) {
			newState.activeFilters = {};
		}

		return newState;
	}

	generatePageHeader() {
		const { listType, years } = this.state;
		if (listType === "fixtures") {
			return "Fixtures";
		} else {
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
					onChange={ev => this.props.history.push(`/games/results/${ev.target.value}`)}
					value={this.state.year}
				>
					{options}
				</select>,
				<span key="results-header"> Results</span>
			];
		}
	}

	generateTeamTypeMenu() {
		const { listType, year } = this.state;
		const teamTypes = _.keyBy(this.props.teamTypes, "_id");
		const coreUrl = listType === "fixtures" ? `/games/fixtures` : `/games/results/${year}`;
		const submenu = _.chain(this.props.gameList)
			.filter(game => validateGameDate(game, listType, year))
			.map(game => game._teamType)
			.uniq()
			.map(id => teamTypes[id])
			.sortBy("sortOrder")
			.map(teamType => {
				const { name, slug } = teamType;
				return (
					<NavLink key={slug} to={`${coreUrl}/${slug}`} activeClassName="active">
						{name}
					</NavLink>
				);
			})
			.value();

		const dummyLinkUrls = [coreUrl];
		if (listType === "results") {
			dummyLinkUrls.push("/games/results");
		}
		const dummyLinks = dummyLinkUrls.map(url => {
			return (
				<NavLink
					key={url}
					exact={true}
					className="hidden"
					to={url}
					activeClassName="active"
				/>
			);
		});

		return (
			<div className="sub-menu">
				{dummyLinks}
				{submenu}
			</div>
		);
	}

	populateGameList() {
		const { games, activeFilters } = this.state;
		if (!games) {
			return <LoadingPage />;
		} else {
			let isFirst = true;
			const renderedGames = _.chain(games)
				.filter(activeFilters)
				.map(game => {
					const includeCountdown = isFirst;
					isFirst = false;
					return (
						<GameCard key={game._id} game={game} includeCountdown={includeCountdown} />
					);
				})
				.value();

			const result = renderedGames.length ? renderedGames : <h3>No games found</h3>;
			return <div className="container game-list">{result}</div>;
		}
	}

	render() {
		const { listType, games, year, teamType } = this.state;
		const { gameList } = this.props;
		if (!teamType || !gameList) {
			return <LoadingPage />;
		} else {
			const canonical =
				listType === "fixtures" ? `fixtures/${teamType}` : `results/${year}/${teamType}`;
			const pageTitle =
				listType === "fixtures"
					? "Huddersfield Giants Fixtures"
					: `Huddersfield Giants ${year} Results`;
			return (
				<div>
					<HelmetBuilder title={pageTitle} canonical={canonical} />
					<section className="page-header">
						<div className="container">
							<h1>{this.generatePageHeader()}</h1>
							{this.generateTeamTypeMenu()}
							<GameFilters
								games={games}
								onFilterChange={activeFilters => this.setState({ activeFilters })}
								activeFilters={this.state.activeFilters}
							/>
						</div>
					</section>
					{this.populateGameList()}
				</div>
			);
		}
	}
}

function mapStateToProps({ games, teams }, ownProps) {
	const { gameList, fullGames } = games;
	const { teamTypes } = teams;
	return {
		gameList,
		fullGames,
		teamTypes
	};
}

export async function loadData(store, path) {
	const splitPath = path.split("/");

	//Get List Type
	const listType = splitPath[2];

	//Get Game List
	await store.dispatch(fetchGameList());
	const { gameList } = store.getState().games;

	//Get Year
	let year;
	if (listType === "results") {
		if (splitPath.length > 3) {
			year = splitPath[3];
		} else {
			year = _.chain(gameList)
				.reject(game => game.date > new Date())
				.map(game => game.date.getFullYear())
				.max()
				.value();
		}
	}

	//Get Team Type
	await store.dispatch(fetchAllTeamTypes());
	const teamTypes = _.keyBy(store.getState().teams.teamTypes, "_id");
	const teamTypeIndex = listType === "fixtures" ? 3 : 4;
	let teamType;
	if (splitPath.length > teamTypeIndex) {
		const teamTypeFromSlug = _.filter(
			teamTypes,
			teamType => teamType.slug === splitPath[teamTypeIndex]
		);
		if (teamTypeFromSlug.length) {
			teamType = teamTypeFromSlug[0]._id;
		}
	}

	if (!teamType) {
		teamType = _.chain(gameList)
			.filter(game => validateGameDate(game, listType, year))
			.map(game => game._teamType)
			.uniq()
			.map(id => teamTypes[id])
			.minBy("sortOrder")
			.value()._id;
	}

	console.log(teamType);

	//Games To Load
	const games = _.chain(gameList)
		.filter(game => game._teamType === teamType)
		.filter(game => validateGameDate(game, listType, year))
		.map(game => game._id)
		.value();

	return store.dispatch(fetchGames(games));
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGames, fetchGameList, fetchAllTeamTypes }
	)(GameList),
	loadData
};
