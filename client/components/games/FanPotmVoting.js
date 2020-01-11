//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import PersonImage from "../people/PersonImage";
import Countdown from "./Countdown";

//Actions
import { saveFanPotmVote } from "~/client/actions/gamesActions";

//Helpers
import { getGameStarStats } from "~/helpers/gameHelper";

class FanPotmVoting extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullGames, id } = nextProps;
		const newState = {};

		//Get Game
		newState.game = fullGames[id];

		//Check if user has already voted
		newState.userSavedVote = newState.game.activeUserFanPotmVote;

		//On initial load, start with users saved vote
		if (!prevState.game || prevState.game.id != id) {
			newState.selectedPlayer = newState.userSavedVote;
		}

		//Check if voting has closed
		newState.deadline = new Date(newState.game.fan_potm.deadline);
		newState.votingClosed = new Date() > newState.deadline;

		return newState;
	}

	renderCountdown() {
		const { deadline, votingClosed } = this.state;
		if (votingClosed) {
			return <span className="deadline-text">Voting has now closed</span>;
		} else {
			return (
				<div>
					<span className="deadline-text">Voting Closes</span>
					<Countdown
						date={deadline}
						onFinish={() => this.setState({ votingClosed: true })}
					/>
				</div>
			);
		}
	}

	renderPlayers() {
		const { localTeam } = this.props;
		const { game, selectedPlayer, votingClosed } = this.state;

		const players = game.fan_potm.options.map(id => {
			const { number, _player } = game.eligiblePlayers[localTeam].find(
				p => p._player._id == id
			);

			let playerStatSection;
			if (!votingClosed) {
				const stats = getGameStarStats(game, _player)
					.filter(s => s.key !== "FAN_POTM")
					.filter((stat, i) => i < 3);

				if (stats.length) {
					const renderedStats = stats.map(({ key, value, label }) => (
						<div className="statgroup" key={key}>
							<span className="value">{value} </span>
							<span className="label">{label}</span>
						</div>
					));
					playerStatSection = <div className="stats">{renderedStats}</div>;
				}
			}

			return (
				<div
					key={id}
					className={`player${id == selectedPlayer ? " active" : ""}`}
					onClick={() => this.setState({ selectedPlayer: id, postSubmitMessage: null })}
				>
					<div className="image">
						<PersonImage person={_player} variant="player" />
					</div>
					<div className="details">
						<h6>
							{number ? <span>{number}. </span> : ""}
							{_player.name.first}
							<span className="last-name">{_player.name.last}</span>
						</h6>
						{playerStatSection}
					</div>
				</div>
			);
		});

		return <div className="players">{players}</div>;
	}

	renderSubmitButton() {
		const { isSubmitting, postSubmitMessage, selectedPlayer, userSavedVote } = this.state;

		//If we have a postSubmitMessage, display it as an unclickable button
		//to prevent the page jumping around
		const submitVerb = userSavedVote ? "Update" : "Save";
		const buttonText = postSubmitMessage || `${submitVerb} Your Vote`;

		return (
			<button
				type="button"
				className={postSubmitMessage ? "post-submit" : "submit"}
				disabled={isSubmitting || !selectedPlayer || selectedPlayer == userSavedVote}
				onClick={() => this.handleSubmit()}
			>
				{buttonText}
			</button>
		);
	}
	async handleSubmit() {
		const { saveFanPotmVote } = this.props;
		const { game, selectedPlayer } = this.state;

		//Prevent multiple clicks
		this.setState({ isSubmitting: true });

		//Submit Vote
		const hadAlreadyVoted = await saveFanPotmVote(game._id, selectedPlayer);

		//Inform user
		let postSubmitMessage;
		if (hadAlreadyVoted != null) {
			postSubmitMessage = `Your vote has been ${hadAlreadyVoted ? "updated" : "saved"}!`;
		}
		this.setState({ isSubmitting: false, postSubmitMessage });
	}

	render() {
		const { game } = this.state;
		const { options } = game.fan_potm;

		return (
			<div className="fan-potm-voting">
				<h6 className="header">{`Fans' ${game.genderedString} of the Match`}</h6>
				<p>
					Choose your {game.genderedString} of the Match from the {options.length}{" "}
					{options.length === 1 ? "player" : "players"} below!
				</p>
				<div className="deadline">{this.renderCountdown()}</div>
				{this.renderPlayers()}
				{this.renderSubmitButton()}
			</div>
		);
	}
}

function mapStateToProps({ config, games }) {
	const { localTeam } = config;
	const { fullGames } = games;
	return { fullGames, localTeam };
}

FanPotmVoting.propTypes = {
	id: PropTypes.string.isRequired
};

export default connect(mapStateToProps, { saveFanPotmVote })(FanPotmVoting);
