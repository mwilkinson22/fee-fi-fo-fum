//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import PersonImage from "../people/PersonImage";
import Countdown from "./Countdown";

class FanPotmVoting extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, id } = nextProps;
		const newState = {};

		//Get Game
		newState.game = fullGames[id];

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
		const { game, selectedPlayer } = this.state;

		const players = game.fan_potm.options.map(id => {
			const { number, _player } = game.eligiblePlayers[localTeam].find(
				p => p._player._id == id
			);
			return (
				<div
					key={id}
					className={`player${id == selectedPlayer ? " active" : ""}`}
					onClick={() => this.setState({ selectedPlayer: id })}
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
					</div>
				</div>
			);
		});

		return <div className="players">{players}</div>;
	}

	render() {
		const { game, selectedPlayer } = this.state;
		return (
			<div className="fan-potm-voting">
				<h6 className="header">{`Fans' ${game.genderedString} of the Match`}</h6>
				<div className="deadline">{this.renderCountdown()}</div>
				{this.renderPlayers()}
				<button type="button" className="submit" disabled={!selectedPlayer}>
					Save Your Vote
				</button>
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

export default connect(mapStateToProps)(FanPotmVoting);
