import React, { Component } from "react";
import { Link } from "react-router-dom";
import "datejs";
import TeamImage from "../teams/TeamImage";

export default class AdminGameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};
		const { game } = nextProps;
		const { _opposition, isAway, scores } = game;

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
		return newState;
	}

	render() {
		const { game } = this.props;
		const { status, title, slug } = game;
		const opposition = game._opposition;
		const date = new Date(game.date).toString("H:mm | dddd dS MMM yyyy");
		const homeAwayText = game.isAway ? "(A)" : "(H)";
		const statusDots = [];
		for (let i = 0; i < 3; i++) {
			const backgroundColor = i >= status ? "red" : "green";
			statusDots.push(<div style={{ backgroundColor }} key={i} />);
		}
		return (
			<Link to={"/admin/game/" + slug} className="game-card admin-game-card card">
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
								<li>{title}</li>
							</ul>
						</div>
						<div className="game-status">{statusDots}</div>
					</div>
				</div>
			</Link>
		);
	}
}
