import React, { Component } from "react";
import { Link } from "react-router-dom";
import * as colour from "../../utils/colourHelper";
import "datejs";

export default class GameBox extends Component {
	constructor(props) {
		super(props);
		const gameDate = Date.parse(new Date(this.props.game.date));
		this.state = {
			gameDate,
			includeCountdown: this.props.includeCountdown && gameDate > new Date()
		};
	}

	componentWillMount() {
		if (this.state.includeCountdown) {
			this.getCountdownValues();
			this.interval = setInterval(() => {
				this.getCountdownValues();
			}, 1000);
		}
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	getCountdownValues() {
		const timeDiff = this.state.gameDate - Date.parse(new Date());
		if (timeDiff < 0) {
			clearInterval(this.interval);
		}

		this.setState({
			seconds: this.addLeadingZeroes(Math.floor(timeDiff / 1000) % 60),
			minutes: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60) % 60),
			hours: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60 / 60) % 24),
			days: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60 / 60 / 24))
		});
	}

	addLeadingZeroes(num) {
		return num < 10 ? "0" + num.toString() : num.toString();
	}
	generateCountdown() {
		if (this.state.includeCountdown) {
			const elements = [];
			const opposition = this.props.game._opposition;
			["Days", "Hours", "Minutes", "Seconds"].forEach(segment => {
				elements.push(
					<span
						key={segment + "-val"}
						className="value"
						style={{
							backgroundColor: colour.toRgb(opposition.colours.text),
							color: colour.toRgb(opposition.colours.main)
						}}
					>
						{this.state[segment.toLowerCase()]}
					</span>
				);
				elements.push(
					<span key={segment + "-label"} className="label">
						{segment}
					</span>
				);
			});

			return <span className="game-countdown">{elements}</span>;
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
				className="game-box"
				style={{ backgroundImage: `url('${ground.image}')` }}
			>
				<div
					className="game-box-content"
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
					<div>
						<h4>
							{opposition.name.short} {homeAwayText}
						</h4>
						<ul>
							<li>{date.toLocaleString()}</li>
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
