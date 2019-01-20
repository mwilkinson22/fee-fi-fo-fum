import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../LoadingPage";
import GameFilters from "./GameFilters";
import { fetchGames, fetchGameLists } from "../../actions/gamesActions";
import GameCard from "./GameCard";
import { NavLink } from "react-router-dom";
import HelmetBuilder from "../HelmetBuilder";

class GameList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	componentDidMount() {
		const { lists, fetchGameLists } = this.props;
		if (!lists) {
			fetchGameLists();
		}
	}

	static getDerivedStateFromProps(newProps, prevState) {
		const newState = {};
		const { lists, listType, match, fetchGames } = newProps;

		if (lists) {
			//Get Year
			let year;
			if (listType === "fixtures") {
				year = "fixtures";
			} else if (lists[match.params.year]) {
				year = match.params.year;
			} else {
				const years = _.chain(lists)
					.keys()
					.filter(year => !isNaN(Number(year)))
					.value();

				year = _.max(years);
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
		const { listType } = this.props;
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
		const { lists, listType } = this.props;
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

export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameLists }
)(GameList);
