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
import { getGameStarStats } from "~/helpers/gameHelper";

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

		const cards = _.chain(game.playerStats)
			.filter(p => p._team == localTeam)
			.map(({ _player }) => {
				const player = game.eligiblePlayers[localTeam].find(p => p._player._id == _player);
				const values = getGameStarStats(game, player._player);

				if (values.length) {
					return { id: _player, values, starPoints: _.sumBy(values, "starPoints") };
				}
			})
			.filter(_.identity)
			.orderBy(["values.length", "starPoints"], ["desc", "desc"])
			.map(({ id, values }) => {
				const { _player, number } = game.eligiblePlayers[localTeam].find(
					p => p._player._id == id
				);

				const rows = _.chain(values)
					.sortBy("value")
					.reverse()
					.map(({ key, label, value, isBest }) => {
						const isPotm = ["POTM", "FAN_POTM"].indexOf(key) > -1;
						const { moreIsBetter } = playerStatTypes[key] || {};
						return (
							<div key={key} className="row">
								<span className={`value ${isPotm ? "upper" : ""}`}>
									{isBest ? (
										<span
											className="best"
											title={`${moreIsBetter ? "Most" : "Least"} in game`}
										>
											★&nbsp;
										</span>
									) : (
										""
									)}
									{value}&nbsp;
								</span>
								<span className="label">{label}</span>
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
