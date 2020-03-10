import React, { Component } from "react";
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
					backgroundColor: team.colours.main,
					color: team.colours.text
				}}
			>
				<div className={`trim ${className || ""}`}>
					<span style={{ backgroundColor: team.colours.trim1 }} />
					<span style={{ backgroundColor: team.colours.trim2 }} />
				</div>
				<div className="container">
					<h4>
						<TeamImage team={team} size="medium" />
						<span className="teamname">{team.name.short}</span>
						{score != null ? <span className="score">{score}</span> : null}
					</h4>
				</div>
			</div>
		);
	}
}
