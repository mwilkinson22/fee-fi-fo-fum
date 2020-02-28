//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "~/client/components/LoadingPage";
import GameFilters from "../games/GameFilters";
import PageSwitch from "../PageSwitch";
import StatsTables from "../games/StatsTables";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Actions
import { fetchPeople } from "~/client/actions/peopleActions";

//Helpers
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import { getPlayersByYearAndGender } from "~/helpers/teamHelper";
import PlayerLeaderboard from "~/client/components/seasons/PlayerLeaderboard";

class SeasonPlayerStats extends Component {
	constructor(props) {
		super(props);

		//Get Players
		const { localTeam, year, getPlayersByYearAndGender, teamType } = props;
		const players = getPlayersByYearAndGender(localTeam, year, teamType);

		this.state = {
			activeFilters: {},
			statType: "total",
			players
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchPeople, fullPeople, games, localTeam } = nextProps;
		const { filteredGames } = prevState;
		const newState = { games };

		if (filteredGames && filteredGames.length) {
			newState.processedStats = _.chain(filteredGames)
				//Only pick those with playerStats (i.e. results)
				.filter(g => g.playerStats && g.playerStats.length)
				//Pull off local team stats
				.map(g =>
					g.playerStats
						.filter(p => p._team == localTeam)
						.map(s => ({ ...s, game: g._id }))
				)
				//Create one big array of playerStat objects
				.flatten()
				//Convert to object, grouped on player id
				.groupBy("_player")
				//Pull off only the stats for each player
				.mapValues(a => a.map(p => p.stats))
				//Convert to an array with the _player id, to ease sorting
				.map((s, _player) => ({ _player, stats: PlayerStatsHelper.sumStats(s) }))
				.value();

			//Loop through the processedStats to see if we have any players not in the
			//standard team object, for when teams share squads
			const otherTeamPlayers = newState.processedStats
				.map(p => p._player)
				.filter(id => !prevState.players[id]);

			if (otherTeamPlayers.length) {
				//First, we check the fullPeople object
				const playersToLoad = otherTeamPlayers.filter(id => !fullPeople[id]);

				//If there are any, then we load (if we haven't already)
				if (playersToLoad.length && !prevState.isLoadingPlayers) {
					fetchPeople(playersToLoad);
					newState.isLoadingPlayers = true;
				}

				//To get to this point, there have to be players not in the state
				//players object, but loaded into fullPeople. This means we can
				//update the players object and set isLoadingPlayers to false
				if (!playersToLoad.length) {
					newState.players = {
						...prevState.players
					};
					otherTeamPlayers.forEach(id => {
						newState.players[id] = { _id: id, _player: fullPeople[id] };
					});
					newState.isLoadingPlayers = false;
				}

				if (!prevState.isLoadingPlayers) {
					newState.isLoadingPlayers = true;
				}
			}
		}
		return newState;
	}

	renderLeaderboards() {
		const { players, statType, processedStats } = this.state;
		const allStats = [
			"T",
			"G",
			"PT",
			"TA",
			"M",
			"C",
			"AG",
			"OF",
			"TB",
			"CB",
			"TK",
			"MT",
			"TS",
			"P"
		];
		const groupedStats = _.groupBy(allStats, s => playerStatTypes[s].type);

		return _.map(groupedStats, (stats, group) => {
			const leaderboards = stats
				.map(key => {
					const list = PlayerLeaderboard.generateOrderedList(
						key,
						processedStats,
						statType
					);
					if (list.length) {
						return (
							<PlayerLeaderboard
								key={key}
								statKey={key}
								players={players}
								statType={statType}
								stats={processedStats}
							/>
						);
					}
				})
				.filter(_.identity);
			if (leaderboards.length) {
				return (
					<div className="leaderboard-wrapper" key={group}>
						<h2>{group}</h2>
						<div className="leaderboards">{leaderboards}</div>
					</div>
				);
			}
		});
	}

	renderStatTables() {
		const { players, statType, processedStats } = this.state;

		const rows = processedStats.map(({ _player, stats }) => {
			//Generate first column
			const p = players[_player];
			const sortValue = p.number ? ("00" + p.number).slice(-3) : `999-${p._player.name.last}`;
			const first = {
				content: (
					<Link to={`/players/${p._player.slug}`}>
						{p.number ? `${p.number}. ` : ""}
						{p._player.name.full}
					</Link>
				),
				sortValue
			};

			//Stat Columns
			const statData = _.mapValues(stats, (data, key) => {
				const value = data[statType];
				const nullValue = playerStatTypes[key].moreIsBetter ? -1 : 10000000000;
				return {
					content: PlayerStatsHelper.toString(key, value),
					sortValue: value != null ? value : nullValue
				};
			});

			const games = {
				content: _.chain(stats)
					.map("gameCount")
					.max()
					.value()
			};

			return {
				key: _player,
				data: {
					first,
					games,
					...statData
				}
			};
		});
		return (
			<StatsTables
				rows={rows}
				firstColumnHeader="Player"
				showTotal={false}
				showAverage={false}
				addGames={statType !== "best"}
			/>
		);
	}

	render() {
		const { games, statType, filteredGames, isLoadingPlayers } = this.state;

		let content;
		if (!filteredGames || isLoadingPlayers) {
			content = <LoadingPage key="loading" />;
		} else if (!filteredGames.length) {
			content = (
				<div className="container" key="no-game">
					<h3>No games found</h3>
				</div>
			);
		} else {
			content = [
				<section className="stat-type-switch" key="switch">
					<div className="container">
						<PageSwitch
							currentValue={statType}
							onChange={statType => this.setState({ statType })}
							options={[
								{ value: "total", label: "Season Total" },
								{ value: "average", label: "Average Per Game" },
								{ value: "best", label: "Best In a Single Game" }
							]}
						/>
					</div>
				</section>,
				<section className="player-leaderboards" key="leaderboard">
					<div className="container">{this.renderLeaderboards()}</div>
				</section>,
				<section className="player-stat-tables" key="stat-tables">
					<h2>Stats</h2>
					<div className="container">{this.renderStatTables()}</div>
				</section>
			];
		}

		return [
			<section className="game-filters" key="filters">
				<div className="container">
					<GameFilters
						games={games}
						onFilterChange={filteredGames => this.setState({ filteredGames })}
						friendliesByDefault={false}
					/>
				</div>
			</section>,
			content
		];
	}
}

SeasonPlayerStats.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	year: PropTypes.number.isRequired
};

SeasonPlayerStats.defaultProps = {};

function mapStateToProps({ config, people, teams }) {
	const { localTeam } = config;
	const { fullPeople } = people;
	const { fullTeams } = teams;
	return { localTeam, fullPeople, fullTeams };
}

export default connect(mapStateToProps, { fetchPeople, getPlayersByYearAndGender })(
	SeasonPlayerStats
);
