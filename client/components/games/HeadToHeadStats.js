//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";

class HeadToHeadStats extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, localTeam, fullTeams } = nextProps;
		const newState = { game };
		newState.teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			newState.teams = newState.teams.reverse();
		}
		return newState;
	}

	processStats() {
		const { game, teams } = this.state;
		const processedStats = _.chain(game.playerStats)
			.groupBy("_team")
			.mapValues(obj => {
				const stats = _.map(obj, p => p.stats);
				const summedStats = _.mapValues(playerStatTypes, (obj, key) => _.sumBy(stats, key));
				const processedStats = PlayerStatsHelper.processStats(summedStats);
				return processedStats;
			})
			.value();

		const groupedStats = _.chain(playerStatTypes)
			.map((obj, key) => {
				//Get values
				const values = _.chain(teams)
					.map(({ _id }) => [_id, processedStats[_id][key]])
					.fromPairs()
					.value();

				if (_.sum(_.values(values))) {
					return {
						key,
						values,
						type: obj.type
					};
				} else {
					return null;
				}
			})
			.filter(_.identity)
			.groupBy("type")
			.value();

		return groupedStats;
	}

	renderStats(statGroups) {
		const { teams } = this.state;
		return _.map(statGroups, (stats, type) => {
			const rows = stats.map(({ key, values }) => {
				const homeValue = values[teams[0]._id];
				const awayValue = values[teams[1]._id];

				//Determine value to highlight
				const { moreIsBetter } = playerStatTypes[key];
				let homeHighlight, awayHighlight;
				if (homeValue == awayValue) {
					homeHighlight = true;
					awayHighlight = true;
				} else {
					homeHighlight = moreIsBetter ? homeValue > awayValue : awayValue > homeValue;
					awayHighlight = !homeHighlight;
				}

				//Get Percentages
				const total = homeValue + awayValue;
				let homePc = Math.round((homeValue / total) * 100);
				if (!moreIsBetter) {
					homePc = 100 - homePc;
				}

				//Get Colours
				const statBarColours = _.map(
					teams,
					({ colours }) => colours.statBarColour || colours.main
				);

				return [
					<div className={`value${homeHighlight ? " highlighted" : ""}`} key="homeValue">
						{PlayerStatsHelper.toString(key, homeValue)}
					</div>,
					<div className="name" key="name">
						{playerStatTypes[key].plural}
					</div>,
					<div className={`value${awayHighlight ? " highlighted" : ""}`} key="awayValue">
						{PlayerStatsHelper.toString(key, awayValue)}
					</div>,
					<div key="stat-bar-wrapper" className="stat-bar-wrapper">
						<div className="stat-bar" style={{ backgroundColor: statBarColours[1] }}>
							<div
								className="stat-bar-inner"
								style={{
									width: `${homePc}%`,
									backgroundColor: statBarColours[0]
								}}
							/>
						</div>
					</div>
				];
			});
			return (
				<div key={type} className="card head-to-head-table">
					<h6>{type}</h6>
					{rows}
				</div>
			);
		});
	}

	render() {
		const statGroups = this.processStats();
		if (Object.keys(statGroups).length) {
			return (
				<section className="head-to-head">
					<h2>Head To Head</h2>
					<div className="container">{this.renderStats(statGroups)}</div>
				</section>
			);
		}
	}
}

HeadToHeadStats.propTypes = {
	game: PropTypes.object.isRequired
};

HeadToHeadStats.defaultProps = {};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(HeadToHeadStats);
