import React, { Component } from "react";
import { Link } from "react-router-dom";
import * as colour from "../../utils/colourHelper";
import "datejs";
import Countdown from "./Countdown";

export default class GameCard extends Component {
	constructor(props) {
		super(props);
		const gameDate = Date.parse(new Date(this.props.game.date));
		this.state = {
			gameDate,
			includeCountdown: this.props.includeCountdown && gameDate > new Date()
		};
	}

	componentWillReceiveProps(nextProps, nextContext) {
		if (this.props.includeCountdown !== nextProps.includeCountdown) {
			this.setState({
				includeCountdown: nextProps.includeCountdown && this.state.gameDate > new Date()
			});
		}
	}

	generateCountdown() {
		if (this.state.includeCountdown) {
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
							{opposition.name.short} {homeAwayText}
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
