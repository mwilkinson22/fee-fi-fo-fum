//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Actions
import { fetchGameList, fetchGames } from "../../actions/gamesActions";

//Helpers
import { validateGameDate } from "../../../helpers/gameHelper";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import playerStatTypes from "../../../constants/playerStatTypes";

//Components
import SingleStatBox from "../stats/SingleStatBox";
import LoadingPage from "../LoadingPage";
import StatsTables from "../games/StatsTables";
import GameFilters from "../games/GameFilters";

class PlayerStatSection extends Component {
	constructor(props) {
		super(props);
		const { gameList, fetchGameList } = props;

		if (!gameList) {
			fetchGameList();
		}

		this.state = { activeFilters: {} };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { gameList, fullGames, teamTypes, fetchGames, person } = nextProps;
		const { playerStatYears } = person;
		const newState = {};
		if (gameList) {
			//Years for selector
			newState.years = _.chain(playerStatYears)
				.keys()
				.sort()
				.reverse()
				.value();

			//Active year
			newState.year = prevState.year || _.max(newState.years);

			//Team Types for active year
			newState.teamTypes = _.chain(playerStatYears[newState.year])
				.map(id => teamTypes[id])
				.sortBy("sortOrder")
				.value();

			//Active Team Type
			newState.teamType = prevState.teamType || newState.teamTypes[0]._id;

			//Get Games
			const gameIds = _.chain(gameList)
				.filter(game => {
					return game._teamType === newState.teamType;
				})
				.filter(game => validateGameDate(game, "results", newState.year))
				.map(game => game._id)
				.value();

			const gamesToLoad = _.filter(gameIds, id => fullGames[id] === undefined);
			if (gamesToLoad.length) {
				fetchGames(gamesToLoad);
				newState.games = undefined;
			} else {
				newState.games = _.chain(gameIds)
					.map(id => fullGames[id])
					.filter({ playerStats: [{ _player: person._id }], squadsAnnounced: true })
					.cloneDeep()
					.map(game => {
						game.playerStats = _.filter(game.playerStats, stats => {
							return stats._player == person._id;
						});
						return game;
					})
					.value();
			}
		}

		return newState;
	}

	getHeader() {
		const { years, year, teamTypes, teamType, games } = this.state;

		//Title
		let yearSelector;
		if (years.length === 1) {
			yearSelector = years[0];
		} else {
			yearSelector = (
				<select
					value={year}
					onChange={ev =>
						this.setState({
							year: ev.target.value,
							activeFilters: {},
							teamType: undefined
						})
					}
				>
					{years.map(year => (
						<option key={year}>{year}</option>
					))}
				</select>
			);
		}

		//TeamTypes Menu
		const submenu = _.chain(teamTypes)
			.map(type => {
				const { name, _id } = type;
				return (
					<span
						key={_id}
						className={`pseudo-link ${_id === teamType ? "active" : ""}`}
						onClick={() => this.setState({ teamType: _id })}
					>
						{name}
					</span>
				);
			})
			.value();
		const teamTypeMenu = <div className="sub-menu light">{submenu}</div>;
		return (
			<div className="section-header">
				<div className="container">
					<h1>{yearSelector} Playing Stats</h1>
					{teamTypeMenu}
					<GameFilters
						games={games || []}
						onFilterChange={activeFilters => this.setState(activeFilters)}
						activeFilters={this.state.activeFilters}
					/>
				</div>
			</div>
		);
	}

	getStatBoxes() {
		const { games, activeFilters } = this.state;
		const filteredGames = _.filter(games, activeFilters);
		const positions = _.chain(filteredGames)
			.map(game => {
				switch (game.playerStats[0].position) {
					case 1:
						return "Fullback";
					case 2:
					case 5:
						return "Wing";
					case 3:
					case 4:
						return "Centre";
					case 6:
						return "Stand Off";
					case 7:
						return "Scrum Half";
					case 8:
					case 10:
						return "Prop";
					case 9:
						return "Hooker";
					case 11:
					case 12:
						return "Second Row";
					case 13:
						return "Loose Forward";
					default:
						return "Interchange";
				}
			})
			.groupBy()
			.map((arr, position) => ({ position, count: arr.length }))
			.sortBy("count")
			.reverse()
			.value();

		const maxPosition = _.map(positions)[0].count;
		const positionCards = _.map(positions, ({ count, position }) => (
			<tr key={position}>
				<th>{position}</th>
				<td>
					<span
						className="position-bar"
						style={{ width: `${(count / maxPosition) * 100}%` }}
					>
						{count}
					</span>
				</td>
			</tr>
		));

		const statBoxStats = {
			Scoring: ["T", "TA", "PT", "G", "KS"],
			Attack: ["M", "C", "AG", "TB", "CB", "E", "DR", "FT", "OF"],
			Defence: ["TK", "MT", "TS", "P"]
		};

		const totalStats = PlayerStatsHelper.sumStats(
			_.map(filteredGames, game => game.playerStats[0].stats)
		);

		const statBoxes = _.map(statBoxStats, (keys, category) => {
			const header = <h2 key={category}>{category}</h2>;
			const boxes = _.chain(keys)
				.filter(key => totalStats[key])
				.filter(key => totalStats[key].gameCount > 0)
				.filter(key => totalStats[key].total > 0 || !playerStatTypes[key].moreIsBetter)
				.map(key => (
					<SingleStatBox
						key={key}
						statKey={key}
						statValues={totalStats[key]}
						includeSummed={filteredGames.length > 1}
					/>
				))
				.value();
			if (boxes.length) {
				return (
					<div key={category}>
						{header}
						<div className="single-stat-boxes">{boxes}</div>
					</div>
				);
			} else {
				return null;
			}
		});

		return (
			<div className="container" key="boxes">
				<div className="single-stat-boxes positions">
					<div className="single-stat-box card">
						<div className="total">{filteredGames.length}</div>
						<div className="name">{filteredGames.length === 1 ? "Game" : "Games"}</div>
					</div>
					<div className="single-stat-box card">
						<table>
							<tbody>{positionCards}</tbody>
						</table>
					</div>
				</div>
				{statBoxes}
			</div>
		);
	}

	render() {
		const { years, games, activeFilters } = this.state;
		if (!years) {
			return <LoadingPage />;
		}

		let content;
		if (!games) {
			content = <LoadingPage />;
		} else {
			const filteredGames = _.filter(games, activeFilters);
			if (filteredGames.length === 0) {
				content = (
					<div className="container no-games-found" key="no-games-found">
						No game data available
					</div>
				);
			} else {
				content = [
					this.getStatBoxes(),
					<div className="container" key="tables">
						<h2>Games</h2>
						<StatsTables listType="player" data={filteredGames} />
					</div>
				];
			}
		}

		return (
			<section className="player-stats">
				{this.getHeader()}
				<div className="section-content">{content}</div>
			</section>
		);
	}
}

function mapStateToProps({ games, teams }) {
	const { teamTypes } = teams;
	const { gameList, fullGames } = games;
	return { teamTypes, gameList, fullGames };
}

export default connect(
	mapStateToProps,
	{ fetchGameList, fetchGames }
)(PlayerStatSection);
