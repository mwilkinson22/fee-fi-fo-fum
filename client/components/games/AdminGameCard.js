import React, { Component } from "react";
import { Link } from "react-router-dom";
import * as colour from "../../utils/colourHelper";
import "datejs";
import TeamImage from "../teams/TeamImage";
import _ from "lodash";

export default class AdminGameCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
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

	getStatus() {
		const { pregameSquads, playerStats } = this.props.game;
		if (Object.keys(_.pickBy(pregameSquads)).length < 2) {
			return 0;
		} else if (Object.keys(_.groupBy(playerStats, "_team")).length < 2) {
			return 1;
		} else if (!_.sumBy(playerStats, "stats.TK")) {
			return 2;
		} else {
			return 3;
		}
	}

	render() {
		const { game } = this.props;
		const opposition = game._opposition;
		const date = new Date(game.date).toString("H:mm | dddd dS MMM yyyy");
		const homeAwayText = game.isAway ? "(A)" : "(H)";
		const url = game.slug;
		const title = game.title;
		const status = [];
		for (let i = 0; i < 3; i++) {
			const backgroundColor = i >= this.getStatus() ? "red" : "green";
			status.push(<div style={{ backgroundColor }} key={i} />);
		}
		return (
			<Link to={"/admin/game/" + url} className="game-card admin-game-card card">
				<div
					className="game-card-content"
					style={{
						backgroundColor: colour.toRgb(opposition.colours.main),
						color: colour.toRgb(opposition.colours.text)
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
						<div className="game-status" children={status} />
					</div>
				</div>
			</Link>
		);
	}
}
