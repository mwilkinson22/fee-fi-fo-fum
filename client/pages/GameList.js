import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import GameFilters from "../components/games/GameFilters";
import { fetchGames, fetchGameLists } from "../actions/gamesActions";
import GameCard from "../components/games/GameCard";
import { NavLink } from "react-router-dom";
import HelmetBuilder from "../components/HelmetBuilder";

class GameList extends Component {
	constructor(props) {
		super(props);
		const { lists, match, fetchGameLists } = props;

		const listType = match.path.split("/")[2];

		if (!lists) {
			fetchGameLists();
		}

		this.state = { listType };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { lists, match, fetchGames } = nextProps;

		//Fixtures or Results?
		const listType = match.path.split("/")[2];
		if (prevState.listType !== listType) newState.listType = listType;

		if (lists) {
			//Get Year
			let year;
			if (listType === "fixtures") {
				year = "fixtures";
			} else if (lists[match.params.year]) {
				year = match.params.year;
			} else {
				year = getMostRecentYear(lists);
			}
			if (year !== prevState.year) {
				newState.year = year;
				newState.activeFilters = {};
			}

			//Get Team Type
			let teamType;
			if (lists[year][match.params.teamType]) {
				teamType = match.params.teamType;
			} else {
				teamType = _.sortBy(lists[year], "sortOrder")[0].slug;
			}
			if (teamType !== prevState.teamType) {
				newState.teamType = teamType;
				newState.activeFilters = {};
			}

			//Get Games
			const { games } = lists[year][teamType];
			if (!games) {
				fetchGames(year, teamType);
				newState.games = null;
			} else {
				newState.games = games;
			}
		}

		return newState;
	}

	generatePageHeader() {
		const { listType } = this.state;
		if (listType === "fixtures") {
			return "Fixtures";
		} else {
			const options = _.chain(this.props.lists)
				.keys()
				.filter(year => !isNaN(Number(year)))
				.map(year => {
					return (
						<option key={year} value={year}>
							{year}
						</option>
					);
				})
				.sort()
				.reverse()
				.value();
			return [
				<select
					key="year-selector"
					children={options}
					onChange={ev => this.props.history.push(`/games/results/${ev.target.value}`)}
					value={this.state.year}
				/>,
				<span key="results-header"> Results</span>
			];
		}
	}

	generateTeamMenu() {
		const { year } = this.state;
		const { lists } = this.props;
		const { listType } = this.state;
		const coreUrl = year === "fixtures" ? `/games/fixtures` : `/games/results/${year}`;
		const submenu = _.chain(lists[year])
			.sortBy("sortOrder")
			.map(team => {
				const { name, slug } = team;
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
		const { year, teamType } = this.state;
		if (!year || !teamType) {
			return <LoadingPage />;
		} else {
			const canonical =
				year === "fixtures" ? `fixtures/${teamType}` : `results/${year}/${teamType}`;
			const pageTitle =
				year === "fixtures"
					? "Huddersfield Giants Fixtures"
					: `Huddersfield Giants ${year} Results`;
			return (
				<div>
					<HelmetBuilder title={pageTitle} canonical={canonical} />
					<section className="page-header">
						<div className="container">
							<h1>{this.generatePageHeader()}</h1>
							{this.generateTeamMenu()}
							<GameFilters
								games={this.state.games}
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

function mapStateToProps({ games }, ownProps) {
	const { lists } = games;
	return {
		lists,
		...ownProps
	};
}

function getMostRecentYear(lists) {
	return _.chain(lists)
		.keys()
		.filter(year => !isNaN(Number(year)))
		.max()
		.value();
}

async function loadData(store, path) {
	await store.dispatch(fetchGameLists());
	const { lists } = store.getState().games;
	const splitPath = path.split("/");
	const listType = splitPath[2];
	let list, teamType, year;

	if (listType === "fixtures") {
		//No year for fixtures
		year = listType;

		//Add team type
		if (splitPath.length > 3 && lists[year][splitPath[3]]) {
			teamType = splitPath[3];
		}
	} else {
		//Get Year
		if (splitPath.length > 3 && lists[splitPath[3]]) {
			year = splitPath[3];
		} else {
			year = getMostRecentYear(lists);
		}

		//Add team type
		if (splitPath.length > 4 && lists[year][splitPath[4]]) {
			teamType = splitPath[4];
		}
	}

	//Get TeamType, if not already defined
	if (!teamType) {
		teamType = _.sortBy(lists[year], "sortOrder")[0].slug;
	}

	return store.dispatch(fetchGames(year, teamType));
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGames, fetchGameLists }
	)(GameList),
	loadData
};
