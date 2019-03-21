import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import GameFilters from "../components/games/GameFilters";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import AdminGameCard from "../components/games/AdminGameCard";
import HelmetBuilder from "../components/HelmetBuilder";
import { NavLink } from "react-router-dom";

class AdminGameList extends Component {
	constructor(props) {
		super(props);
		const { gameList, fetchGameList } = props;

		if (!gameList) {
			fetchGameList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { gameList, match, fetchGames } = nextProps;
		if (gameList) {
			//Get Year
			const year =
				match.params.year ||
				_.chain(gameList)
					.map(game => game.date.getFullYear())
					.max()
					.value();

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
		const options = _.chain(this.props.lists)
			.keys()
			.map(year => {
				return (
					<option key={year} value={year}>
						{year === "fixtures" ? "Fixtures" : year}
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
				onChange={ev => this.props.history.push(`/admin/games/${ev.target.value}`)}
				className="with-border"
				value={this.state.year}
			/>
		];
	}

	generateTeamMenu() {
		const { year } = this.state;
		const { lists } = this.props;
		const coreUrl = `/admin/games/${year}`;
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
		const dummyLinkUrls = [coreUrl, "/admin/games"];
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
				.map(game => {
					return <AdminGameCard key={game._id} game={game} />;
				})
				.value();

			const result = renderedGames.length ? renderedGames : <h3>No games found</h3>;
			return <div className="container admin-game-list">{result}</div>;
		}
	}

	render() {
		const { year, teamType } = this.state;
		if (!year || !teamType) {
			return <LoadingPage />;
		} else {
			return (
				<div className="admin-page">
					<HelmetBuilder title="4Fs Admin - Games" />
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
	const { gameList } = games;
	return {
		gameList,
		...ownProps
	};
}

export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameList }
)(AdminGameList);
