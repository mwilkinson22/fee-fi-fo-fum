import React, { Component } from "react";
import { Link } from "react-router-dom";

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
							backgroundColor: `rgba(${opposition.colours.text.join(",")}, 0.9)`,
							color: `rgb(${opposition.colours.main.join(",")})`
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
		const date = new Date(this.props.game.date);
		const homeAwayText = this.props.game.isAway ? "(A)" : "(H)";
		const url = this.props.game.slug;
		return (
			<Link
				to={"/games/" + url}
				className="game-box"
				style={{ backgroundImage: `url('${ground.image}')` }}
			>
				<div
					className="game-box-content"
					style={{
						backgroundColor: `rgba(${opposition.colours.main.join(",")}, 0.9)`,
						color: `rgb(${opposition.colours.text.join(",")})`,
						borderColor: `rgb(${opposition.colours.trim1.join(",")})`
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
							{this.generateCountdown()}
						</ul>
					</div>
				</div>
			</Link>
		);
	}
}
