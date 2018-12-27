import React, { Component } from "react";

export default class Countdown extends Component {
	componentWillMount() {
		this.getCountdownValues();
		this.interval = setInterval(() => {
			this.getCountdownValues();
		}, 1000);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	getCountdownValues() {
		const timeDiff = this.props.date - Date.parse(new Date());
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

	render() {
		const elements = [];

		["Days", "Hours", "Minutes", "Seconds"].forEach(segment => {
			elements.push(
				<span
					key={segment + "-val"}
					className="value"
					style={{
						backgroundColor: this.props.background,
						color: this.props.colour
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
	}
}
