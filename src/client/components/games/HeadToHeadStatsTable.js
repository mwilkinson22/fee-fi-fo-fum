//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import { calculateAdditionalStats, statToString } from "~/helpers/statsHelper";

class HeadToHeadStats extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		return { game };
	}

	processStats(keys) {
		const { game } = this.state;

		const processedStats = _.chain(game.playerStats)
			.groupBy("_team")
			.mapValues(obj => {
				const stats = _.map(obj, "stats");
				const summedStats = _.fromPairs(keys.map(key => [key, _.sumBy(stats, key)]));
				return calculateAdditionalStats(summedStats, game.date.getFullYear());
			})
			.value();

		return _.chain(keys)
			.map(key => {
				//No reason to return 'Points'
				if (key == "PT") {
					return null;
				}

				//Get values
				const values = _.chain(game.teams)
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
	}

	render() {
		const { header, statTypes } = this.props;
		const { game } = this.state;
		const stats = this.processStats(statTypes);

		const rows = stats.map(({ key, values }) => {
			const homeValue = values[game.teams[0]._id];
			const awayValue = values[game.teams[1]._id];

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
			const statBarColours = _.map(game.teams, ({ colours }) => colours.statBarColour || colours.main);

			return [
				<div className={`value${homeHighlight ? " highlighted" : ""}`} key="homeValue">
					{statToString(key, homeValue)}
				</div>,
				<div className="name" key="name">
					{playerStatTypes[key].plural}
				</div>,
				<div className={`value${awayHighlight ? " highlighted" : ""}`} key="awayValue">
					{statToString(key, awayValue)}
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

export default HeadToHeadStats;
