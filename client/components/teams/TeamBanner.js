import React, { Component } from "react";
import Colour from "color";
import TeamImage from "../../components/teams/TeamImage";

export default class TeamBanner extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		return nextProps;
	}

	render() {
		const { team, className, score } = this.state;
		return (
			<div
				className={`team-banner ${className || ""}`}
				style={{
					backgroundColor: Colour(team.colours.main).hex(),
					color: Colour(team.colours.text).hex()
				}}
			>
				<div className={`trim ${className || ""}`}>
					<span style={{ backgroundColor: Colour(team.colours.trim1).hex() }} />
					<span style={{ backgroundColor: Colour(team.colours.trim2).hex() }} />
				</div>
				<div className="container">
					<h4>
						<TeamImage team={team} />
						<span className="teamname">{team.name.short}</span>
						{score ? <span className="score">{score}</span> : null}
					</h4>
				</div>
			</div>
		);
	}
}
