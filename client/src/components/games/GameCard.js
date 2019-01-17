import React, { Component } from "react";
import { Link } from "react-router-dom";
import * as colour from "../../utils/colourHelper";
import "datejs";
import Countdown from "./Countdown";
import _ from "lodash";

export default class GameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { game } = nextProps;
		const { _opposition, playerStats, isAway, scores } = game;

		//Get date
		const gameDate = prevState.gameDate || Date.parse(new Date(game.date));
		if (!prevState.gameDate) {
			newState.gameDate = gameDate;
		}

		//isFixture?
		const isFixture = gameDate > new Date();
		newState.isFixture = isFixture;

		//Score
		if (scores) {
			const localScore = scores["5c041478e2b66153542b3742"];
			const oppositionScore = scores[_opposition._id];
			if (localScore && oppositionScore) {
				const oppositionName = _opposition.name.short;
				if (isAway) {
					newState.scoreString = `${oppositionName} ${oppositionScore}-${localScore} Giants`;
				} else {
					newState.scoreString = `Giants ${localScore}-${oppositionScore} ${oppositionName}`;
				}
			}
		}

		//Include countdown?
		newState.includeCountdown = nextProps.includeCountdown && isFixture;

		return newState;
	}

	generateCountdown() {
		const { includeCountdown } = this.state;
		if (includeCountdown) {
			const opposition = this.props.game._opposition;
			return (
				<Countdown
					date={this.state.gameDate}
					background={colour.toRgb(opposition.colours.text)}
					colour={colour.toRgb(opposition.colours.main)}
				/>
			);
		} else {
			return null;
		}
	}
	render() {
		const opposition = this.props.game._opposition;
		const ground = this.props.game._ground;
		const date = new Date(this.props.game.date).toString("H:mm | dddd dS MMM yyyy");
		const homeAwayText = this.props.game.isAway ? "(A)" : "(H)";
		const url = this.props.game.slug;
		const title = this.props.game.title;
		return (
			<Link
				to={"/games/" + url}
				className="game-card card"
				style={{ backgroundImage: `url('${ground.image}')` }}
			>
				<div
					className="game-card-content"
					style={{
						backgroundColor: colour.toRgba(opposition.colours.main, 0.9),
						color: colour.toRgb(opposition.colours.text),
						borderColor: colour.toRgb(opposition.colours.trim1)
					}}
				>
					<div
						style={{ backgroundImage: `url('${opposition.image}')` }}
						className="team-badge"
					/>
					<div className="game-details-wrapper">
						<h4>
							{this.state.scoreString || `${opposition.name.short} ${homeAwayText}`}
						</h4>
						<ul>
							<li className="date">{date.toLocaleString()}</li>
							<li>
								{ground.name}, {ground.address._city.name}
							</li>
							<li>{title}</li>
							{this.generateCountdown()}
						</ul>
					</div>
				</div>
			</Link>
		);
	}
}
