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

	static getDerivedStateFromProps(nextProps) {
		const { game, localTeam, fullTeams } = nextProps;
		const newState = { game };
		newState.teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			newState.teams = newState.teams.reverse();
		}
		return newState;
	}

	processStats(keys) {
		const { game, teams } = this.state;

		const processedStats = _.chain(game.playerStats)
			.groupBy("_team")
			.mapValues(obj => {
				const stats = _.map(obj, "stats");
				const summedStats = _.fromPairs(keys.map(key => [key, _.sumBy(stats, key)]));
				const processedStats = PlayerStatsHelper.processStats(summedStats);
				return processedStats;
			})
			.value();

		const groupedStats = _.chain(keys)
			.map(key => {
				//No reason to return 'Points'
				if (key == "PT") {
					return null;
				}

				//Get values
				const values = _.chain(teams)
					.map(({ _id }) => [_id, processedStats[_id][key]])
					.fromPairs()
					.value();

				if (_.sum(_.values(values))) {
					return {
						key,
						values,
						type: playerStatTypes[key].type
					};
				} else {
					return null;
				}
			})
			.filter(_.identity)
			.value();

		return groupedStats;
	}

	render() {
		const { header, statTypes } = this.props;
		const { teams } = this.state;
		const stats = this.processStats(statTypes);

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
			<div className="card head-to-head-table">
				<h6>{header}</h6>
				{rows}
			</div>
		);
	}
}

HeadToHeadStats.propTypes = {
	game: PropTypes.object.isRequired,
	header: PropTypes.string.isRequired,
	statTypes: PropTypes.arrayOf(PropTypes.string).isRequired
};

HeadToHeadStats.defaultProps = {};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(HeadToHeadStats);
