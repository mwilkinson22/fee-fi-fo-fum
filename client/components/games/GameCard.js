import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { toRgba } from "~/helpers/colourHelper";
import Countdown from "./Countdown";
import GameHeaderImage from "./GameHeaderImage";
import TeamImage from "../teams/TeamImage";
import GameLogo from "./GameLogo";
import { googleBucket } from "../../extPaths";

class GameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { game, localTeam } = nextProps;
		const { _opposition, isAway, score } = game;

		//Get date
		const gameDate = prevState.gameDate || Date.parse(new Date(game.date));
		if (!prevState.gameDate) {
			newState.gameDate = gameDate;
		}

		//isFixture?
		const isFixture = gameDate > new Date();
		newState.isFixture = isFixture;

		//Score
		if (score) {
			const localScore = score[localTeam];
			const oppositionScore = score[_opposition._id];
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
					background={opposition.colours.text}
					colour={opposition.colours.main}
				/>
			);
		} else {
			return null;
		}
	}
	render() {
		const { game } = this.props;
		const opposition = game._opposition;
		const ground = game._ground;
		const date = new Date(game.date).toString("H:mm | dddd dS MMM yyyy");
		const homeAwayText = game.isAway ? "(A)" : "(H)";
		const url = game.slug;
		const title = game.title;
		const tvLogo = game.tv ? (
			<img
				src={`${googleBucket}images/layout/icons/${game.tv}.svg`}
				alt={game.tv + " logo"}
			/>
		) : null;
		return (
			<Link to={"/games/" + url} className="game-card card">
				<div className="background-image-wrapper">
					<GameHeaderImage game={game} />
				</div>
				<div
					className="game-card-content"
					style={{
						backgroundColor: toRgba(opposition.colours.main, 0.9),
						color: opposition.colours.text,
						borderColor: opposition.colours.trim1
					}}
				>
					<TeamImage team={opposition} />
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
					<div className="game-icons">
						<GameLogo game={game} className="game-logo" />
						{tvLogo}
					</div>
				</div>
			</Link>
		);
	}
}

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(GameCard);
