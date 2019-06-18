//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Components
import PersonCard from "../people/PersonCard";

//Helpers
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";

class GameStars extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		const newState = { game };
		return newState;
	}

	processCards() {
		const { localTeam } = this.props;
		const { game } = this.state;
		const statTypes = _.chain(playerStatTypes)
			.map((obj, key) => ({ key, ...obj }))
			.filter(s => s.requiredForGameStar !== null)
			.value();

		const processedStats = PlayerStatsHelper.processNestedStats(game.playerStats);
		const cards = _.chain(processedStats)
			.filter(p => p._team == localTeam)
			.map(({ _player, stats }) => {
				const processedStats = PlayerStatsHelper.processStats(stats);
				const values = _.chain(statTypes)
					.map(({ key, moreIsBetter, requiredForGameStar }) => {
						let isValid;

						const value = processedStats[key];

						//Check basic threshold
						if (value) {
							isValid = moreIsBetter
								? value >= requiredForGameStar
								: value <= requiredForGameStar;
						}

						//Check for exceptions
						if (
							(key == "TS" && processedStats.TK < 25) ||
							(key == "KS" && processedStats.G < 4)
						) {
							isValid = false;
						}

						if (isValid) {
							return { key, value };
						}
					})
					.filter(_.identity)
					.value();

				if (values.length) {
					return { id: _player, values };
				}
			})
			.filter(_.identity)
			.sortBy(({ values }) => values.length)
			.reverse()
			.map(({ id, values }) => {
				const { _player, number } = game.eligiblePlayers[localTeam].find(
					p => p._player._id == id
				);

				const rows = _.chain(values)
					.sortBy("value")
					.reverse()
					.map(({ key, value }) => {
						const { moreIsBetter } = playerStatTypes[key];
						const allValues = game.playerStats.map(p => p.stats[key]);
						const bestValue = moreIsBetter ? _.max(allValues) : _.min(allValues);

						return (
							<div key={key} className="row">
								<span className="value">
									{key == "M" ? value : PlayerStatsHelper.toString(key, value)}
								</span>
								<span className="key">{playerStatTypes[key].plural}</span>
								{value == bestValue ? <span className="best">★</span> : ""}
							</div>
						);
					})
					.value();

				return (
					<PersonCard
						number={number}
						person={_player}
						personType={"player"}
						key={id}
						additionalData={<div className="game-star-stats">{rows}</div>}
					/>
				);
			})
			.value();

		return cards;
	}

	render() {
		const cards = this.processCards();
		if (cards.length) {
			return (
				<section className="game-stars">
					<h2>Game Stars</h2>
					<div className="person-card-grouping">{cards}</div>
				</section>
			);
		} else {
			return null;
		}
	}
}

GameStars.propTypes = {
	game: PropTypes.object.isRequired
};

GameStars.defaultProps = {};

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(GameStars);
