//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import TeamImage from "../teams/TeamImage";

//Helpers
import { getScoreString } from "~/helpers/gameHelper";

class AdminGameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};
		const { game, localTeam, fullTeams } = nextProps;

		//Score
		newState.scoreString = getScoreString(game, fullTeams[localTeam]);

		return newState;
	}

	render() {
		const { game } = this.props;
		const opposition = game._opposition;
		const dateFormat = `${game.hasTime ? "H:mm | " : ""}dddd dS MMM yyyy`;
		const date = new Date(game.date).toString(dateFormat);
		const homeAwayText = game.isAway ? "(A)" : "(H)";

		//Create Status Dots
		const statusDots = [];
		for (let i = 0; i < 3; i++) {
			const backgroundColor = i >= game.status ? "red" : "green";

			//Conditionally show pregame squad dot
			if (i > 0 || game._competition.instance.usesPregameSquads) {
				statusDots.push(<div style={{ backgroundColor }} key={i} />);
			}
		}
		return (
			<Link to={`/admin/game/${game._id}`} className="game-card admin-game-card card">
				<div
					className="game-card-content"
					style={{
						backgroundColor: opposition.colours.main,
						color: opposition.colours.text
					}}
				>
					<TeamImage team={opposition} />
					<div className="game-details-wrapper">
						<div className="game-details">
							<h4>
								{this.state.scoreString ||
									`${opposition.name.short} ${homeAwayText}`}
							</h4>
							<ul>
								<li className="date">{date.toLocaleString()}</li>
								<li>{game.title}</li>
							</ul>
						</div>
						<div className="game-status">{statusDots}</div>
					</div>
				</div>
			</Link>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(AdminGameCard);
