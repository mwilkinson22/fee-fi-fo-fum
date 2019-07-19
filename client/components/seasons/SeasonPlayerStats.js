//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import GameFilters from "../games/GameFilters";
import PageSwitch from "../PageSwitch";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

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
		const { games, localTeam } = nextProps;
		const newState = { games };

		newState.activeFilters = prevState.activeFilters || {};

		newState.processedStats = _.chain(games)
			//Filter Games
			.filter(newState.activeFilters)
			//Only pick those with playerStats (i.e. results)
			.filter(g => g.playerStats && g.playerStats.length)
			//Pull off local team stats
			.map(g =>
				g.playerStats.filter(p => p._team == localTeam).map(s => ({ ...s, game: g._id }))
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

	render() {
		const { games, activeFilters, statType } = this.state;
		return [
			<section className="game-filters" key="filters">
				<div className="container">
					<GameFilters
						games={games}
						activeFilters={activeFilters}
						onFilterChange={activeFilters => this.setState({ activeFilters })}
					/>
				</div>
			</section>,
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
			</section>
		];
	}
}

SeasonPlayerStats.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	year: PropTypes.number.isRequired
};

SeasonPlayerStats.defaultProps = {};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(
	mapStateToProps,
	{ getPlayersByYearAndGender }
)(SeasonPlayerStats);
