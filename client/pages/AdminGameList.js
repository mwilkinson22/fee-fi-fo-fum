import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import GameFilters from "../components/games/GameFilters";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import AdminGameCard from "../components/games/AdminGameCard";
import { Link, NavLink } from "react-router-dom";
import { validateGameDate } from "../../helpers/gameHelper";
import HelmetBuilder from "../components/HelmetBuilder";

class AdminGameList extends Component {
	constructor(props) {
		super(props);
		const { gameList, match, fetchGameList } = props;

		if (!gameList) {
			fetchGameList();
		}

		this.state = { listType: match.params.year === "fixtures" ? "fixtures" : "results" };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { gameList, fullGames, teamTypes, match, fetchGames } = nextProps;
		newState.listType =
			!match.params.year || match.params.year === "fixtures" ? "fixtures" : "results";

		if (!gameList) {
			return {};
		}

		//Team Type
		if (match.params.teamType) {
			const filteredTeamType = _.find(teamTypes, t => t.slug === match.params.teamType);
			if (filteredTeamType) {
				newState.teamType = filteredTeamType._id;
			}
		}

		if (!newState.teamType) {
			newState.teamType = _.chain(teamTypes)
				.values()
				.minBy("sortOrder")
				.value()._id;
		}

		//Years
		const now = new Date();
		//Get Years
		const years = _.chain(gameList)
			.reject(game => game.date > now)
			.map(game => game.date.getFullYear())
			.uniq()
			.sort()
			.reverse()
			.value();
		newState.years = ["fixtures", ...years];

		//Get Active Year
		newState.year = match.params.year || newState.years[0];

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
		const { years } = this.state;
		const options = _.map(years, year => {
			return (
				<option key={year} value={year}>
					{year === "fixtures" ? "All Fixtures" : `${year} Results`}
				</option>
			);
		});
		return [
			<select
				key="year-selector"
				onChange={ev => this.props.history.push(`/admin/games/${ev.target.value}`)}
				value={this.state.year}
			>
				{options}
			</select>
		];
	}

	generateTeamTypeMenu() {
		const { listType, year } = this.state;
		const { teamTypes } = this.props;
		const coreUrl = `/admin/games/${year}`;
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

		const dummyLinkUrls = ["/admin/games", coreUrl];
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
			const renderedGames = _.chain(games)
				.filter(activeFilters)
				.map(game => <AdminGameCard key={game._id} game={game} />)
				.value();

			const result = renderedGames.length ? renderedGames : <h3>No games found</h3>;
			return <div className="container admin-game-list">{result}</div>;
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
							<Link to="/admin/game/new" className="card nav-card">
								Add New Game
							</Link>
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

export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameList }
)(AdminGameList);
