//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

//Components
import LeaderBoard from "./Leaderboard";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";

class SeasonPlayerLeaderboard extends Component {
	//Static so we can call it externally and determine whether to render
	//Otherwise we can't conditionally render the wrapper
	static generateOrderedList(key, stats, statType) {
		const { moreIsBetter, plural, singular } = playerStatTypes[key];
		return (
			_.chain(stats)
				//Get Player and corresponding stat
				.map(({ _player, stats }) => {
					const { gameCount, total } = stats[key];
					const title = `${total} ${total == 1 ? singular : plural} in ${gameCount} ${
						gameCount == 1 ? "game" : "games"
					}`;
					return {
						_player,
						value: stats[key][statType],
						title
					};
				})
				//Remove null values
				.reject(({ value }) => value == null)
				//Remove values of 0, when moreIsBetter = true
				.reject(({ value }) => moreIsBetter && !value)
				//For Tackle Success, ensure we have an average of at least 20 per game
				.filter(({ _player }) => {
					if (key !== "TS") {
						return true;
					} else {
						const { average } = _.find(stats, s => s._player == _player).stats.TK;
						return average >= 20;
					}
				})
				//Order Remaining Entries
				.orderBy(
					["value", "gameCount"],
					[
						moreIsBetter ? "desc" : "asc",
						moreIsBetter && statType == "total" ? "asc" : "desc"
					]
				)
				.value()
		);
	}

	renderList(key) {
		const { stats, statType, players } = this.props;

		const { moreIsBetter, plural, singular } = playerStatTypes[key];

		//Order the list
		let orderedList = SeasonPlayerLeaderboard.generateOrderedList(key, stats, statType);

		//Limit to everyone better than (or equal to) fifth place
		if (orderedList.length > 5) {
			const threshold = orderedList[4].value;
			orderedList = orderedList.filter(p =>
				moreIsBetter ? p.value >= threshold : p.value <= threshold
			);
		}

		//Create Grouped Array
		let position = 1;
		const list = _.chain(orderedList)
			//Group players on equal values
			.groupBy("value")
			//Convert Back to an array
			.orderBy(arr => arr[0].value, moreIsBetter ? "desc" : "asc")
			//Format
			.map(arr => {
				let positionText = position.toString();
				if (arr.length > 1) {
					positionText += "=";
				}

				//Update the position int for the next iteration
				position += arr.length;

				//Loop through values
				const names = arr.map(({ _player, total, gameCount }, i) => {
					const { name, slug } = players[_player]._player;
					const title = `${total} ${total == 1 ? singular : plural} in ${gameCount} ${
						gameCount == 1 ? "game" : "games"
					}`;

					return (
						<span key={slug}>
							<Link to={`/players/${slug}`} title={title}>
								{name.full}
							</Link>
							{i < arr.length - 1 ? ",\u00A0" : ""}
						</span>
					);
				});

				return [
					<div className="position" key={position}>
						{positionText}
					</div>,
					<div className="name" key="name">
						{names}
					</div>,
					<div className="value" key="value">
						{PlayerStatsHelper.toString(key, arr[0].value)}
					</div>
				];
			})
			.value();

		return { list, leader: orderedList.length && orderedList[0]._player };
	}

	render() {
		const { statKey, statType, stats, players } = this.props;

		const { moreIsBetter, plural } = playerStatTypes[statKey];

		return (
			<LeaderBoard
				higherValueIsBetter={moreIsBetter}
				list={SeasonPlayerLeaderboard.generateOrderedList(statKey, stats, statType)}
				players={players}
				placeCount={5}
				renderValue={value => PlayerStatsHelper.toString(statKey, value)}
				title={plural}
				titleCondition={statKey === "TS" ? "(with at least 20 per game)" : ""}
			/>
		);
	}
}

SeasonPlayerLeaderboard.propTypes = {
	statKey: PropTypes.string.isRequired,
	players: PropTypes.object.isRequired,
	statType: PropTypes.string.isRequired,
	stats: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default SeasonPlayerLeaderboard;
