//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

//Components
import GameHeaderImage from "./GameHeaderImage";
import BroadcasterImage from "../broadcasters/BroadcasterImage";
import TeamImage from "../teams/TeamImage";
import GameLogo from "./GameLogo";

//Helpers
import { toRgba } from "~/helpers/colourHelper";
import { formatDate, getScoreString } from "~/helpers/gameHelper";
import Countdown from "./Countdown";

class GameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, isLarge } = nextProps;
		const newState = { isLarge };

		//Get date
		const gameDate = prevState.gameDate || Date.parse(new Date(game.date));
		if (!prevState.gameDate) {
			newState.gameDate = gameDate;
		}

		//isFixture?
		const isFixture = gameDate > new Date();
		newState.isFixture = isFixture;

		//Score
		newState.scoreString = getScoreString(game);

		//Include countdown?
		newState.includeCountdown = nextProps.includeCountdown && isFixture;

		return newState;
	}

	generateCountdown() {
		const { game } = this.props;
		const { includeCountdown } = this.state;
		if (includeCountdown && !game.dateRange) {
			const opposition = game._opposition;
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
		const { game, hideImage } = this.props;
		const { isLarge } = this.state;
		const opposition = game._opposition;

		//Ground variables
		let groundString;
		let groundClass;
		if (game._ground) {
			groundString = `${game._ground.name}, ${game._ground.address._city.name}`;
		} else {
			groundString = "Venue TBD";
			groundClass = "no-ground";
		}
		let homeAwayText = "";
		if (!game.isNeutralGround) {
			homeAwayText = game.isAway ? " (A)" : " (H)";
		}
		const url = game.slug;
		const title = game.title;
		let broadcastLogo;
		if (game._broadcaster) {
			broadcastLogo = <BroadcasterImage broadcaster={game._broadcaster} />;
		}

		let backgroundImage;
		if (!hideImage) {
			backgroundImage = (
				<div className="background-image-wrapper">
					<GameHeaderImage game={game} size={isLarge ? "large-gamecard" : "gamecard"} />
				</div>
			);
		}

		return (
			<Link
				to={"/games/" + url}
				className={`game-card card ${hideImage ? "hidden-image" : ""} ${game.hideGame ? "hidden-game" : ""}`}
			>
				{backgroundImage}
				<div
					className="game-card-content"
					style={{
						backgroundColor: toRgba(opposition.colours.main, 0.9),
						color: opposition.colours.text,
						borderColor: opposition.colours.trim1
					}}
				>
					<TeamImage team={opposition} size="medium" />
					<div className="game-details-wrapper">
						<h4>{this.state.scoreString || `${opposition.name.short}${homeAwayText}`}</h4>
						<ul>
							<li className="date">{formatDate(game)}</li>
							<li className={groundClass}>{groundString}</li>
							<li>{title}</li>
							{this.generateCountdown()}
						</ul>
					</div>
					<div className="game-icons">
						<GameLogo game={game} className="game-logo" size="small" />
						{broadcastLogo}
					</div>
				</div>
			</Link>
		);
	}
}

GameCard.propTypes = {
	game: PropTypes.object.isRequired,
	hideImage: PropTypes.bool,
	isLarge: PropTypes.bool
};

GameCard.defaultProps = {
	hideImage: false,
	isLarge: false
};

export default GameCard;
