import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../LoadingPage";
import { fetchGames, fetchGameLists } from "../../actions/gamesActions";
import GameCard from "./GameCard";

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
			}

			//Get Games
			const { games } = lists[year][teamType];
			if (!games) {
				fetchGames(year, teamType);
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

	filterGames() {
		const { year, teamType } = this.state;
		const activeFilters = this.props.lists[year][teamType].activeFilters || {};
	}

	generateFilters() {
		const { games } = this.state;
		const filters = {
			_competition: { name: "Competition", options: [] },
			_opposition: { name: "Opposition", options: [] },
			isAway: {
				name: "Venue",
				options: [{ name: "Home", value: false }, { name: "Away", value: true }]
			}
		};

		if (games) {
			filters._competition.options = _.chain(games)
				.map(game => ({ name: game._competition.name, value: game._competition._id }))
				.uniqBy("value")
				.sortBy("name")
				.value();

			filters._opposition.options = _.chain(games)
				.map(game => ({ name: game._opposition.name.long, value: game._opposition._id }))
				.uniqBy("value")
				.sortBy("name")
				.value();
		}

		return _.map(filters, (data, filter) => {
			const { name } = data;
			const options = _.map(data.options, option => {
				return (
					<option key={option.value} value={option.value}>
						{option.name}
					</option>
				);
			});

			return (
				<div key={filter} className="list-filter">
					<h4>{name}</h4>
					<select>
						<option value="">All</option>
						{options}
					</select>
				</div>
			);
		});
	}

	populateGameList() {
		const { games } = this.state;

		if (!games) {
			return <LoadingPage />;
		} else if (games.length === 0) {
			return "No games found";
		} else {
			let isFirst = true;
			const renderedGames = games.map(game => {
				const includeCountdown = isFirst;
				isFirst = false;
				return <GameCard key={game._id} game={game} includeCountdown={includeCountdown} />;
			});
			return <div className="container game-list">{renderedGames}</div>;
		}
	}

	render() {
		const { year, teamType } = this.state;
		if (!year || !teamType) {
			return <LoadingPage />;
		} else {
			return (
				<div>
					<section className="page-header">
						<div className="container">
							<h1>{this.generatePageHeader()}</h1>
							<div className="list-filters">{this.generateFilters()}</div>
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
