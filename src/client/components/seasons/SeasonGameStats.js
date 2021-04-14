//Modules
import _ from "lodash";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import LoadingPage from "~/client/components/LoadingPage";
import GameFilters from "../games/GameFilters";
import PageSwitch from "../PageSwitch";
import StatsTables from "../games/StatsTables";
import StatTableGameCell from "../games/StatTableGameCell";

//Actions
import { fetchTeam } from "~/client/actions/teamsActions";

//Helpers
import { calculateAdditionalStats, getTotalsAndAverages } from "~/helpers/statsHelper";

class SeasonGameStats extends Component {
	constructor(props) {
		super(props);

		const { localTeam, fullTeams } = props;

		const localTeamName = fullTeams[localTeam].name.short;
		const options = {
			totalOrIndividual: {
				Total: "Team Total",
				Individual: "Best Individual"
			},
			teamToLoad: {
				Local: localTeamName,
				Opposition: "Opposition",
				Combined: "Both",
				Differential: `Differential`
			}
		};
		this.state = {
			activeFilters: {},
			totalOrIndividual: options.totalOrIndividual.Total,
			teamToLoad: options.teamToLoad.Local,
			options
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, localTeam } = nextProps;

		const { filteredGames } = prevState;
		const newState = { games };

		if (filteredGames && filteredGames.length) {
			newState.gamesWithProcessedStats = _.chain(filteredGames)
				//Limit to results
				.filter(g => g.status >= 2)
				//Get separate local and team stats
				.map(g => {
					//Grab only the necessary properties
					const game = _.pick(g, ["_id", "date", "_opposition", "title", "slug", "playerStats"]);

					//Group the stats by local and opposition
					game.stats = _.chain(game.playerStats)
						.groupBy(({ _team }) => (_team === localTeam ? "local" : "opposition"))
						.mapValues(playerStatArray => getTotalsAndAverages(playerStatArray.map(s => s.stats)))
						.value();

					return game;
				})
				.value();
		}
		return newState;
	}

	handlePageSwitch(name, value) {
		const { teamToLoad, options } = this.state;

		//Create new state object which we'll then build
		const newState = {};

		//Update the name and value as normal
		newState[name] = value;

		//If we're switching from team to individual stats, we
		//disable the differential option. Unselect it here if
		//necessary
		if (
			name === "totalOrIndividual" &&
			value === options.totalOrIndividual.Individual &&
			teamToLoad === options.teamToLoad.Differential
		) {
			newState.teamToLoad = options.teamToLoad.Local;
		}

		//Update the state
		this.setState(newState);
	}

	renderPageSwitch(name) {
		const { options, totalOrIndividual } = this.state;

		//Add header label
		let header;
		if (name === "totalOrIndividual") {
			header = "Stat Type";
		} else {
			header = "Team";
		}

		//Convert options to correct format
		const formattedOptions = _.map(this.state.options[name], value => ({ value }));

		//For individual stats, remove the differential option
		if (name === "teamToLoad" && totalOrIndividual === options.totalOrIndividual.Individual) {
			formattedOptions.pop();
		}

		return [
			<h3 key={`header-${name}`}>{header}</h3>,
			<PageSwitch
				currentValue={this.state[name]}
				onChange={value => this.handlePageSwitch(name, value)}
				options={formattedOptions}
				key={`page-switch-${name}`}
			/>
		];
	}

	renderTable() {
		const { localTeam, year } = this.props;
		const { gamesWithProcessedStats, options, totalOrIndividual, teamToLoad } = this.state;

		//Create a custom stat type object to be populated as we scan games
		let customStatTypes = {};

		//Create Rows
		const rowData = gamesWithProcessedStats.map(game => {
			const first = {
				content: <StatTableGameCell game={game} includeYear={year === "All"} />,
				sortValue: game.date.getTime()
			};

			//Grab either the total or best for each stat
			const totalOrBest = totalOrIndividual === options.totalOrIndividual.Total ? "total" : "best";
			const aggregateStats = _.mapValues(game.stats, statCollection => {
				return _.mapValues(statCollection, s => s[totalOrBest]);
			});

			//Process them dependent on the teamToLoad option
			let stats;
			switch (teamToLoad) {
				case options.teamToLoad.Local:
					stats = aggregateStats.local;
					break;
				case options.teamToLoad.Opposition:
					stats = aggregateStats.opposition;
					break;
				case options.teamToLoad.Combined: {
					//Use getTotalsAndAverages to recalculate the best and total for each stat
					const reaggregatedStats = getTotalsAndAverages(_.values(aggregateStats));

					//Depending on totalOrIndividual, pull off the correct value.
					//For total, we want the "total" property, i.e. both teams combined
					//For individual we want the "best" property, i.e. the best individual effort
					stats = _.mapValues(reaggregatedStats, s => s[totalOrBest]);
					break;
				}
				case options.teamToLoad.Differential: {
					stats = {};
					for (const statKey in aggregateStats.local) {
						const local = aggregateStats.local[statKey];
						const opposition = aggregateStats.opposition[statKey];
						if (local == null && opposition == null) {
							stats[statKey] = null;
						} else {
							stats[statKey] = (local || 0) - (opposition || 0);
						}
					}
					break;
				}
			}

			//Recalculate non-db stats
			stats = calculateAdditionalStats(stats);

			//Work out milestone stats
			if (totalOrIndividual === options.totalOrIndividual.Total) {
				const statsToProcess = {};

				//Check for metres
				const metresFound = game.playerStats.filter(p => p.stats.M).length;
				if (metresFound) {
					customStatTypes.M100 = "Made 100m";
					statsToProcess.M100 = game.playerStats.filter(p => p.stats.M && p.stats.M >= 100);
				}

				//Check for tackles & tackle success
				const tacklesFound = game.playerStats.filter(p => p.stats.TK).length;
				if (tacklesFound) {
					customStatTypes.TK30 = "Made 30 Tackles";
					statsToProcess.TK30 = game.playerStats.filter(p => p.stats.TK & (p.stats.TK >= 30));

					customStatTypes.TS95 = "Had a 95% Tackle Rate (min. 20 tackles)";
					statsToProcess.TS95 = game.playerStats.filter(p => {
						const processedStats = calculateAdditionalStats(p.stats);
						return processedStats.TS > 95 && processedStats.TK + processedStats.MI >= 20;
					});
				}

				//Process stats
				for (const statType in statsToProcess) {
					const teamCounts = _.chain(statsToProcess[statType])
						.groupBy(({ _team }) => (_team == localTeam ? "local" : "opposition"))
						.mapValues("length")
						.value();

					const localCount = teamCounts.local || 0;
					const oppositionCount = teamCounts.opposition || 0;

					switch (teamToLoad) {
						case options.teamToLoad.Local:
							stats[statType] = localCount;
							break;
						case options.teamToLoad.Opposition:
							stats[statType] = oppositionCount;
							break;
						case options.teamToLoad.Combined:
							stats[statType] = localCount + oppositionCount;
							break;
						case options.teamToLoad.Differential:
							stats[statType] = localCount - oppositionCount;
							break;
					}
				}
			}

			return {
				key: game._id,
				data: {
					first,
					...stats
				}
			};
		});

		//Convert custom stat types to array
		customStatTypes = _.map(customStatTypes, (label, key) => ({
			key,
			singular: label,
			plural: label,
			type: "Players Who…",
			moreIsBetter: true,
			headerClassName: "mobile-wrap custom-game-stat-header"
		}));

		return (
			<StatsTables
				customStatTypes={customStatTypes}
				firstColumnHeader="Game"
				rowData={rowData}
				showTotal={true}
				showAverage={false}
			/>
		);
	}

	renderContent() {
		const { filteredGames, isLoadingPlayers } = this.state;

		//Await dependencies
		if (!filteredGames || isLoadingPlayers) {
			return <LoadingPage />;
		}

		//Check we have at least one game
		if (!filteredGames.length) {
			return (
				<div className="container">
					<h3>No games found</h3>
				</div>
			);
		}

		return (
			<Fragment>
				<section className="stat-type-switch" key="switch">
					<div className="container">
						{this.renderPageSwitch("totalOrIndividual")}
						{this.renderPageSwitch("teamToLoad")}
					</div>
				</section>
				<section className="tables" key="tables">
					<div className="container">{this.renderTable()}</div>
				</section>
			</Fragment>
		);
	}

	render() {
		const { year } = this.props;
		const { games } = this.state;

		return (
			<Fragment>
				<section className="game-filters" key="filters">
					<div className="container">
						<GameFilters
							addToFromDates={year === "All"}
							games={games}
							onFilterChange={filteredGames => this.setState({ filteredGames })}
							friendliesByDefault={false}
						/>
					</div>
				</section>
				{this.renderContent()}
			</Fragment>
		);
	}
}

SeasonGameStats.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

SeasonGameStats.defaultProps = {};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps, { fetchTeam })(SeasonGameStats);
